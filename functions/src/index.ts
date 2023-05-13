import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export type Todo = {
  id: string,
  owner: string;
  text: string;
  isCompleted: boolean;
  participants: string[];
}

function getRandomId() {
  // just for the demo, not a good idea in production
  return Math.random().toString(36).substring(2, 9);
}


export const createTodo = functions.https.onCall(async (data: unknown, context) => {
  const { text } = data as any;
  if (typeof text != "string") {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument \"message\""
    );
  }

  if (!context.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in to create a todo.");
  }

  const id = getRandomId();
  await admin.firestore()
      .collection("todos")
      .doc(id).set({
        id,
        owner: context.auth?.uid,
        text: text,
        isCompleted: false,
        participants: [],
      });
  return {
    success: true,
    todoId: id,
  };
});

export const updateTodoStatus = functions.https.onCall(async (data: unknown, context) => {
  const { todoId, isCompleted } = data as any;
  if (typeof todoId != "string" || typeof isCompleted != "boolean") {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with two arguments \"message\" and \"status\".");
  }

  if (!context.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in to create a todo.");
  }

  const todoDoc = await admin.firestore().collection("todos").doc(todoId).get();
  if (!todoDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Todo not found");
  }
  const todo = todoDoc.data() as Todo;

  if (todo.owner != context.auth?.uid && !todo.participants.includes(context.auth?.uid)) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "You are not the owner of this todo and it is not shared with you"
    );
  }

  await admin.firestore()
      .collection("todos")
      .doc(todoId).update({
        isCompleted: isCompleted,
      });
  return {
    success: true,
  };
});


export const shareTodo = functions.https.onCall(async (data: unknown, context) => {
  const { todoId, uid, access } = data as any;
  if (typeof todoId != "string" || !["grant", "revoke"].includes(access) || typeof uid != "string") {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with three arguments");
  }

  if (!context.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in to create a todo.");
  }

  const todo = await admin.firestore().collection("todos").doc(todoId).get();
  if (!todo.exists) {
    throw new functions.https.HttpsError("not-found", "Todo not found");
  }
  if (todo.data()?.owner != context.auth?.uid) {
    throw new functions.https.HttpsError("permission-denied", "You are not the owner of this todo");
  }

  await admin.firestore()
      .collection("todos")
      .doc(todoId).update({
        participants: access === "grant" ?
        admin.firestore.FieldValue.arrayUnion(uid) :
        admin.firestore.FieldValue.arrayRemove(uid),
      });
  return {
    success: true,
  };
});


export const deleteTodo = functions.https.onCall(async (data: unknown, context) => {
  const { todoId } = data as any;
  if (typeof todoId != "string") {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with one argument");
  }

  if (!context.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in to create a todo.");
  }

  const todo = await admin.firestore().collection("todos").doc(todoId).get();
  if (!todo.exists) {
    throw new functions.https.HttpsError("not-found", "Todo not found");
  }
  if (todo.data()?.owner != context.auth?.uid) {
    throw new functions.https.HttpsError("permission-denied", "You are not the owner of this todo");
  }

  await admin.firestore()
      .collection("todos")
      .doc(todoId).delete();
  return {
    success: true,
  };
});
