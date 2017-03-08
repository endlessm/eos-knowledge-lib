#include "mainloop.h"

#include <uv.h>
#include <glib.h>

using namespace v8;

struct ThreadData {
  uv_thread_t thread_handle;
  uv_mutex_t mutex_handle;
  uv_async_t async_handle;
  GPollFD *fds;
  gint nfds;
};

static void DispatchGLibMainloop (uv_async_t *async_handle) {
  ThreadData *data = (ThreadData *)async_handle->data;
  GMainContext *context = g_main_context_default ();
  g_main_context_acquire (context);
  g_main_context_dispatch (context);
  g_main_context_release (context);
  uv_mutex_unlock (&data->mutex_handle);
}

static void IterateGLibMainloop (ThreadData *data) {
  GMainContext *context = g_main_context_default ();
  gint max_priority, timeout;
  g_main_context_prepare (context, &max_priority);

  gint nfds;
  while ((nfds = g_main_context_query (context, max_priority, &timeout, data->fds, data->nfds)) > data->nfds) {
    delete[] data->fds;
    data->fds = new GPollFD[nfds];
    data->nfds = nfds;
  }

  g_poll (data->fds, data->nfds, timeout);

  gboolean some_ready = g_main_context_check (context, max_priority, data->fds, data->nfds);

  if (some_ready) {
    g_main_context_release (context);
    uv_async_send(&data->async_handle);
    uv_mutex_lock (&data->mutex_handle);
    g_main_context_acquire (context);
  }
}

static void RunGLibMainloop (ThreadData *data) {
  g_main_context_acquire (g_main_context_default ());
  uv_mutex_lock (&data->mutex_handle);
  while (uv_loop_alive (uv_default_loop ()))
    IterateGLibMainloop(data);
  delete data;
}

void StartGLibMainloop (const FunctionCallbackInfo<Value> &args) {
  ThreadData *data = new ThreadData();
  uv_mutex_init (&data->mutex_handle);
  uv_async_init (uv_default_loop (), &data->async_handle, DispatchGLibMainloop);
  data->async_handle.data = data;

  uv_thread_create (&data->thread_handle, (uv_thread_cb)RunGLibMainloop, data);
}
