import functionTest from "firebase-functions-test";
import { createTodo, shareTodo, updateTodoStatus, deleteTodo } from "../src/index";
import { PROJECT_ID } from "./config";
import * as admin from "firebase-admin";

const apiTest = functionTest({
  projectId: PROJECT_ID,
});

type ApiKey = "createTodo" | "shareTodo" | "updateTodoStatus" | "deleteTodo";

type Api<T> = Record<ApiKey, T>;

type ApiType = typeof createTodo;
type WrapApiType = ReturnType<typeof apiTest.wrap>;


const allMyApis: Api<ApiType> = {
  createTodo,
  shareTodo,
  updateTodoStatus,
  deleteTodo,
};


async function mockUser(uid: string | null, register = true): Promise<Api<WrapApiType>> {
  if (uid != null && register) {
    await admin.auth().createUser({
      uid,
    });
  }
  const wrappedApis = {} as Api<WrapApiType>;
  Object.keys(allMyApis)
      .map((key) => key as ApiKey)
      .forEach((key) => {
        wrappedApis[key] = (p: any) => apiTest.wrap(allMyApis[key])(p, { auth: { uid } });
      });
  return wrappedApis;
}

export {
  admin,
  apiTest,
  mockUser,
};
