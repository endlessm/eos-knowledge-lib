/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2015 Endless Mobile, Inc. */

#include "ekns-utils.h"

struct parallel_init_data {
  int n_left;
  GError *error;
  GCancellable *internal_cancel;
};

static void
parallel_init_abort (struct parallel_init_data *data)
{
  g_cancellable_cancel (data->internal_cancel);
}

static void
init_callback (GObject      *source_object,
               GAsyncResult *result,
               gpointer      user_data)
{
  struct parallel_init_data *data = user_data;
  GError *error = NULL;

  data->n_left--;

  if (!g_async_initable_init_finish (G_ASYNC_INITABLE (source_object), result, &error))
    {
      if (data->error == NULL)
        g_propagate_error (&data->error, error);

      parallel_init_abort (data);
      return;
    }
}

static void
user_cancelled (GCancellable *cancellable,
                gpointer      user_data)
{
  struct parallel_init_data *data = user_data;

  g_cancellable_set_error_if_cancelled (cancellable, &data->error);
  parallel_init_abort (data);
}

/**
 * ekns_utils_parallel_init:
 * @initables: (element-type GAsyncInitable)
 * @io_priority: The IO priority to init at.
 * @cancellable: A #GCancellable
 * @error: The output error.
 *
 * Synchronously initializes a list of #GAsyncInitables in parallel.
 */
gboolean
ekns_utils_parallel_init (GSList        *initables,
                          int            io_priority,
                          GCancellable  *cancellable,
                          GError       **error)
{
  GMainContext *context = g_main_context_new ();
  g_main_context_push_thread_default (context);

  struct parallel_init_data data = {
    .internal_cancel = g_cancellable_new (),
  };

  if (cancellable)
    g_cancellable_connect (cancellable, G_CALLBACK (user_cancelled), &data, NULL);

  data.n_left = g_slist_length (initables);

  GSList *l;
  for (l = initables; l; l = l->next)
    {
      GAsyncInitable *initable = G_ASYNC_INITABLE (l->data);
      g_async_initable_init_async (initable, io_priority, data.internal_cancel, init_callback, &data);
    }

  while (data.n_left > 0)
    g_main_context_iteration (context, TRUE);

  g_object_unref (data.internal_cancel);
  g_main_context_pop_thread_default (context);
  g_main_context_unref (context);

  if (data.error)
    {
      g_propagate_error (error, data.error);
      return FALSE;
    }
  else
    {
      return TRUE;
    }
}
