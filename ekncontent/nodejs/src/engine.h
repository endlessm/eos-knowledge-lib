#pragma once

#include <node.h>

using namespace v8;

void EngineGetObject(const FunctionCallbackInfo<Value> &args);
void EngineQuery(const FunctionCallbackInfo<Value> &args);
