
#pragma once

#include <node.h>
#include <girepository.h>

v8::Local<v8::Function> MakeBoxed(v8::Isolate *isolate, GIBaseInfo *info);

v8::Local<v8::Value> WrapperFromBoxed(v8::Isolate *isolate, GIBaseInfo *info, void *data);
void * BoxedFromWrapper(v8::Local<v8::Value>);
