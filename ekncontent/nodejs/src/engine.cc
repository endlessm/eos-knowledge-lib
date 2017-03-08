#include "engine.h"
#include "gobject.h"

#include <eos-knowledge-content.h>

using namespace v8;

struct CallbackData {
  Persistent<Function> resolve;
  Persistent<Function> reject;
};

static void EngineGetObjectCallback(GObject *source,
                                    GAsyncResult *result,
                                    gpointer user_data)
{
  Isolate *isolate = Isolate::GetCurrent ();
  HandleScope scope(isolate);
  CallbackData *data = (CallbackData *)user_data;

  GError *error = NULL;
  EkncContentObjectModel *model;

  if ((model = eknc_engine_get_object_finish (EKNC_ENGINE (source), result, &error))) {
    const unsigned argc = 1;
    Local<Value> argv[argc] = { WrapperFromGObject (isolate, G_OBJECT (model)) };
    Local<Function>::New(isolate, data->resolve)->Call(isolate->GetCurrentContext()->Global(), argc, argv);
  } else {
    const unsigned argc = 1;
    Local<Value> argv[argc] = { Exception::TypeError(String::NewFromUtf8(isolate, error->message)) };
    Local<Function>::New(isolate, data->reject)->Call(isolate->GetCurrentContext()->Global(), argc, argv);
  }

  /* XXX: For some reason we have to resolve microtasks to the promise wrappers to resolve. */
  isolate->RunMicrotasks();
  data->resolve.Reset();
  data->reject.Reset();
  delete data;
}

void EngineGetObject(const FunctionCallbackInfo<Value> &args) {
  Isolate *isolate = args.GetIsolate ();
  GObject *engine = GObjectFromWrapper (args[0]);
  String::Utf8Value id (args[1]->ToString ());
  String::Utf8Value app_id (args[2]->ToString ());
  Local<Function> resolve = Local<Function>::Cast(args[3]);
  Local<Function> reject = Local<Function>::Cast(args[4]);

  CallbackData *data = new CallbackData();
  data->resolve.Reset(isolate, resolve);
  data->reject.Reset(isolate, reject);
  eknc_engine_get_object_for_app (EKNC_ENGINE (engine), *id, *app_id, NULL, (GAsyncReadyCallback)EngineGetObjectCallback, data);
}

static void EngineQueryCallback(GObject *source,
                                GAsyncResult *result,
                                gpointer user_data)
{
  Isolate *isolate = Isolate::GetCurrent ();
  HandleScope scope(isolate);
  CallbackData *data = (CallbackData *)user_data;

  GError *error = NULL;
  EkncQueryResults *results;

  if ((results = eknc_engine_query_finish (EKNC_ENGINE (source), result, &error))) {
    const unsigned argc = 1;
    Local<Value> argv[argc] = { WrapperFromGObject (isolate, G_OBJECT (results)) };
    Local<Function>::New(isolate, data->resolve)->Call(isolate->GetCurrentContext()->Global(), argc, argv);
  } else {
    const unsigned argc = 1;
    Local<Value> argv[argc] = { Exception::TypeError(String::NewFromUtf8(isolate, error->message)) };
    Local<Function>::New(isolate, data->reject)->Call(isolate->GetCurrentContext()->Global(), argc, argv);
  }

  /* XXX: For some reason we have to resolve microtasks to the promise wrappers to resolve. */
  isolate->RunMicrotasks();
  data->resolve.Reset();
  data->reject.Reset();
  delete data;
}

void EngineQuery(const FunctionCallbackInfo<Value> &args) {
  Isolate *isolate = args.GetIsolate ();
  GObject *engine = GObjectFromWrapper (args[0]);
  GObject *query = GObjectFromWrapper (args[1]);
  Local<Function> resolve = Local<Function>::Cast(args[2]);
  Local<Function> reject = Local<Function>::Cast(args[3]);

  CallbackData *data = new CallbackData();
  data->resolve.Reset(isolate, resolve);
  data->reject.Reset(isolate, reject);
  eknc_engine_query (EKNC_ENGINE (engine), EKNC_QUERY_OBJECT (query), NULL, (GAsyncReadyCallback)EngineQueryCallback, data);
}
