import request from "supertest";
import { expect } from "chai";
import { app, MEMORY_DB } from "../index";

describe("Authentication Service", () => {
  // Clear the memory DB before each test
  beforeEach(() => {
    Object.keys(MEMORY_DB).forEach((key) => delete MEMORY_DB[key]);
  });

  describe("POST /register", () => {
    const validUser = {
      username: "testuser",
      email: "test@example.com",
      type: "user",
      password: "Test123!@#",
    };

    it("should successfully register a valid user", async () => {
      const res = await request(app).post("/register").send(validUser);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property(
        "message",
        "User registered successfully",
      );
      expect(res.body).to.have.property("username", validUser.username);
      expect(res.body).to.have.property("email", validUser.email);
      expect(res.body).to.not.have.property("password");
      expect(res.body).to.not.have.property("passwordhash");
    });

    it("should reject registration with existing username", async () => {
      await request(app).post("/register").send(validUser);
      const res = await request(app).post("/register").send(validUser);
      expect(res.status).to.equal(409);
      expect(res.body.error).to.equal("Conflict");
      expect(res.body.message).to.equal("Username already exists");
    });

    it("should reject registration with existing email", async () => {
      await request(app).post("/register").send(validUser);
      const res = await request(app)
        .post("/register")
        .send({
          ...validUser,
          username: "differentuser",
        });
      expect(res.status).to.equal(409);
      expect(res.body.error).to.equal("Conflict");
      expect(res.body.message).to.equal("Email already registered");
    });

    describe("Validation Tests", () => {
      it("should reject short username", async () => {
        const res = await request(app)
          .post("/register")
          .send({
            ...validUser,
            username: "ab",
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal("Validation Error");
      });

      it("should reject invalid email format", async () => {
        const res = await request(app)
          .post("/register")
          .send({
            ...validUser,
            email: "invalid-email",
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal("Validation Error");
      });

      it("should reject invalid user type", async () => {
        const res = await request(app)
          .post("/register")
          .send({
            ...validUser,
            type: "superuser",
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal("Validation Error");
      });

      it("should reject weak password", async () => {
        const res = await request(app)
          .post("/register")
          .send({
            ...validUser,
            password: "weak",
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal("Validation Error");
      });
    });
  });

  describe("POST /login", () => {
    const validUser = {
      username: "testuser",
      email: "test@example.com",
      type: "user",
      password: "Test123!@#",
    };

    beforeEach(async () => {
      await request(app).post("/register").send(validUser);
    });

    it("should successfully login with correct credentials", async () => {
      const res = await request(app).post("/login").send({
        username: validUser.username,
        password: validUser.password,
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("message", "Login successful");
      expect(res.body).to.have.property("username", validUser.username);
      expect(res.body).to.have.property("email", validUser.email);
      expect(res.body).to.have.property("type", validUser.type);
      expect(res.body).to.not.have.property("password");
      expect(res.body).to.not.have.property("passwordhash");
    });

    it("should reject login with incorrect password", async () => {
      const res = await request(app).post("/login").send({
        username: validUser.username,
        password: "wrongpassword",
      });

      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal("Authentication failed");
    });

    it("should reject login with non-existent username", async () => {
      const res = await request(app).post("/login").send({
        username: "nonexistent",
        password: validUser.password,
      });

      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal("Authentication failed");
    });

    describe("Validation Tests", () => {
      it("should reject login without username", async () => {
        const res = await request(app).post("/login").send({
          password: validUser.password,
        });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal("Validation Error");
      });

      it("should reject login without password", async () => {
        const res = await request(app).post("/login").send({
          username: validUser.username,
        });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal("Validation Error");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent registrations properly", async () => {
      const user1 = {
        username: "user1",
        email: "user1@example.com",
        type: "user",
        password: "Test123!@#",
      };

      const user2 = {
        username: "user2",
        email: "user2@example.com",
        type: "user",
        password: "Test123!@#",
      };

      // Send both requests concurrently
      const [res1, res2] = await Promise.all([
        request(app).post("/register").send(user1),
        request(app).post("/register").send(user2),
      ]);

      expect(res1.status).to.equal(201);
      expect(res2.status).to.equal(201);
    });

    it("should handle special characters in username properly", async () => {
      const user = {
        username: "test_user-123",
        email: "test@example.com",
        type: "user",
        password: "Test123!@#",
      };

      const res = await request(app).post("/register").send(user);

      expect(res.status).to.equal(201);
    });
  });
});
