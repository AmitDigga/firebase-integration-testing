import axios from "axios";
import { PROJECT_ID } from "./config";
import { apiTest, admin, mockUser } from "./mock";

jest.setTimeout(30000);

const deletingFirebaseDataUrl =
  `http://localhost:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const deletingAuthDataUrl = `http://localhost:9099/emulator/v1/projects/${PROJECT_ID}/accounts`;


async function oneTimeInitialization() {
  try {
    admin.initializeApp({
      projectId: PROJECT_ID,
    });
  } catch (e) {
    console.log(e);
  }
}

async function oneTimeTearDown() {
  await Promise.all(admin.apps.map((app) => app?.delete()));
  apiTest.cleanup();
}

async function eachTearDown() {
  await axios.delete(deletingFirebaseDataUrl);
  await axios.delete(deletingAuthDataUrl);
}


describe("Integration Testing of APIs", () => {
  beforeAll(async () => {
    await oneTimeInitialization();
  });
  afterAll(async () => {
    await oneTimeTearDown();
  });

  afterEach(async () => {
    await eachTearDown();
  }
  );

  describe("createTodo", () => {
    it("should create a todo", async () => {
      const testUser = await mockUser("test");
      const result = await testUser.createTodo({ text: "Hello Todo" });
      const data = await admin.firestore().collection("todos").doc(result.todoId).get();
      expect(data.data()).toEqual({
        id: result.todoId,
        owner: "test",
        text: "Hello Todo",
        isCompleted: false,
        participants: [],
      });
    });


    it("should fail with missing parameters", async () => {
      const testUser = await mockUser("test");
      await expect(testUser.createTodo({})).rejects.toThrow();
    });

    it("should fail when user is not authenticated", async () => {
      const nonAuthUser = await mockUser(null);
      await expect(nonAuthUser.createTodo({ text: "Hello Todo" })).rejects.toThrow();
    });
  });

  describe("updateTodoStatus", () => {
    it("should update todo status", async () => {
      const testUser = await mockUser("test");
      const result = await testUser.createTodo({
        text: "Hello Todo",
      });
      await testUser.updateTodoStatus({
        todoId: result.todoId,
        isCompleted: true,
      });
      const data = await admin.firestore().collection("todos").doc(result.todoId).get();
      expect(data.data()).toEqual({
        id: result.todoId,
        owner: "test",
        text: "Hello Todo",
        isCompleted: true,
        participants: [],
      });
    });

    it("should allow participants to update todo status", async () => {
      const testUser = await mockUser("test");
      const otherUser = await mockUser("other");
      const result = await testUser.createTodo({
        text: "Hello Todo",
      });
      await testUser.shareTodo({
        todoId: result.todoId,
        uid: "other",
        access: "grant",
      });
      await otherUser.updateTodoStatus({
        todoId: result.todoId,
        isCompleted: true,
      });
      const data = await admin.firestore().collection("todos").doc(result.todoId).get();
      expect(data.data()).toMatchObject({
        isCompleted: true,
      });
    });

    it("should fail when user is not authenticated", async () => {
      const testUser = await mockUser("test");
      const annonUser = await mockUser(null);
      const result = await testUser.createTodo({
        text: "Hello Todo",
      });
      await expect(annonUser.updateTodoStatus({
        todoId: result.todoId,
        isCompleted: true,
      })).rejects.toThrow();
    });
  });
  describe("shareTodo", () => {
    it("should share todo", async () => {
      const testUser = await mockUser("test");
      await mockUser("other");
      const result = await testUser.createTodo({
        text: "Hello Todo",
      });
      await testUser.shareTodo({
        todoId: result.todoId,
        uid: "other",
        access: "grant",
      });
      const data = await admin.firestore().collection("todos").doc(result.todoId).get();
      expect(data.data()).toMatchObject({
        participants: ["other"],
      });
    });

    it("should remove user from participants when access is revoked", async () => {
      const testUser = await mockUser("test");
      await mockUser("other");
      const result = await testUser.createTodo({
        text: "Hello Todo",
      });
      await testUser.shareTodo({
        todoId: result.todoId,
        uid: "other",
        access: "grant",
      });
      await testUser.shareTodo({
        todoId: result.todoId,
        uid: "other",
        access: "revoke",
      });
      const data = await admin.firestore().collection("todos").doc(result.todoId).get();
      expect(data.data()).toMatchObject({
        participants: [],
      });
    });

    it("should not allow participants to share todo", async () => {
      const testUser = await mockUser("test");
      const otherUser = await mockUser("other");
      await mockUser("third");
      const result = await testUser.createTodo({
        text: "Hello Todo",
      });
      await testUser.shareTodo({
        todoId: result.todoId,
        uid: "other",
        access: "grant",
      });
      await expect(otherUser.shareTodo({
        todoId: result.todoId,
        uid: "third",
        access: "grant",
      })).rejects.toThrow();
    });
  });

  describe("deleteTodo", () => {
    it("should delete todo", async () => {
      const testUser = await mockUser("test");
      const result = await testUser.createTodo({
        text: "Hello Todo",
      });
      await testUser.deleteTodo({
        todoId: result.todoId,
      });
      const data = await admin.firestore().collection("todos").doc(result.todoId).get();
      expect(data.exists).toBeFalsy();
    });

    it("should not allow participants to delete todo", async () => {
      const testUser = await mockUser("test");
      const otherUser = await mockUser("other");
      const result = await testUser.createTodo({
        text: "Hello Todo",
      });
      await testUser.shareTodo({
        todoId: result.todoId,
        uid: "other",
        access: "grant",
      });
      await expect(otherUser.deleteTodo({
        todoId: result.todoId,
      })).rejects.toThrow();
    });
  });
});

