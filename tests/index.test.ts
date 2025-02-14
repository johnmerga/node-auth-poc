import request from "supertest";
import { expect } from "chai";
import { app } from "../src/app";
import { UserService } from "../src/service/user.service";

describe("Authentication Service", () => {
  const userService = new UserService();

  beforeEach(async () => {
    await userService.clearDB();
  });

  describe("POST /auth/register", () => {
    const validUser = {
      username: "testuser",
      email: "test@example.com",
      type: "user",
      password: "Test123!@#",
    };

    it("should successfully register a valid user", async () => {
      const res = await request(app).post("/auth/register").send(validUser);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("user");
      expect(res.body.user).to.have.property("username", validUser.username);
      expect(res.body.user).to.have.property("email", validUser.email);
      expect(res.body.user).to.have.property("type", validUser.type);
      expect(res.body.user).to.not.have.property("password");
      expect(res.body.user).to.not.have.property("passwordHash");
      expect(res.body).to.have.property("tokens");
      expect(res.body.tokens).to.have.property("access");
      expect(res.body.tokens).to.have.property("refresh");
    });

    it("should reject registration with existing username", async () => {
      await request(app).post("/auth/register").send(validUser);
      const res = await request(app).post("/auth/register").send(validUser);
      expect(res.status).to.equal(409);
      expect(res.body.error.message).to.equal("Username already exists");
    });

    it("should reject registration with existing email", async () => {
      await request(app).post("/auth/register").send(validUser);
      const res = await request(app)
        .post("/auth/register")
        .send({
          ...validUser,
          username: "differentuser",
        });
      expect(res.status).to.equal(409);
      expect(res.body.error.message).to.equal("Email already exists");
    });

    describe("Validation Tests", () => {
      it("should reject short username", async () => {
        const res = await request(app)
          .post("/auth/register")
          .send({
            ...validUser,
            username: "ab",
          });
        expect(res.status).to.equal(400);
        expect(res.body.error.message).to.include(
          '"username" length must be at least 3 characters long',
        );
      });

      it("should reject invalid email format", async () => {
        const res = await request(app)
          .post("/auth/register")
          .send({
            ...validUser,
            email: "invalid-email",
          });
        expect(res.status).to.equal(400);
        expect(res.body.error.message).to.include(
          '"email" must be a valid email',
        );
      });

      it("should reject invalid user type", async () => {
        const res = await request(app)
          .post("/auth/register")
          .send({
            ...validUser,
            type: "superuser",
          });

        expect(res.status).to.equal(400);
        expect(res.body.error.message).to.include(
          '"type" must be one of [user, admin]',
        );
      });

      it("should reject weak password", async () => {
        const res = await request(app)
          .post("/auth/register")
          .send({
            ...validUser,
            password: "weak",
          });

        expect(res.status).to.equal(400);
        expect(res.body.error.message).to.include(
          "password must be at least 5 characters",
        );
      });
    });
  });

  describe("POST /auth/login", () => {
    const validUser = {
      username: "testuser",
      email: "test@example.com",
      type: "user",
      password: "Test123!@#",
    };

    beforeEach(async () => {
      await request(app).post("/auth/register").send(validUser);
    });

    it("should successfully login with correct credentials", async () => {
      const res = await request(app).post("/auth/login").send({
        username: validUser.username,
        password: validUser.password,
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("user");
      expect(res.body.user).to.have.property("username", validUser.username);
      expect(res.body.user).to.have.property("email", validUser.email);
      expect(res.body.user).to.have.property("type", validUser.type);
      expect(res.body.user).to.not.have.property("password");
      expect(res.body.user).to.not.have.property("passwordHash");
      expect(res.body).to.have.property("tokens");
      expect(res.body.tokens).to.have.property("access");
      expect(res.body.tokens).to.have.property("refresh");
    });

    it("should reject login with incorrect password", async () => {
      const res = await request(app).post("/auth/login").send({
        username: validUser.username,
        password: "wrongpassword",
      });

      expect(res.status).to.equal(401);
      expect(res.body.error.message).to.equal("Incorrect email or password");
    });

    it("should reject login with non-existent email", async () => {
      const res = await request(app).post("/auth/login").send({
        username: "nonexisten",
        password: validUser.password,
      });

      expect(res.status).to.equal(401);
      expect(res.body.error.message).to.equal("Incorrect email or password");
    });

    describe("Validation Tests", () => {
      it("should reject login without username", async () => {
        const res = await request(app).post("/auth/login").send({
          password: validUser.password,
        });

        expect(res.status).to.equal(400);
        expect(res.body.error.message).to.include('"username" is required');
      });

      it("should reject login without password", async () => {
        const res = await request(app).post("/auth/login").send({
          username: validUser.username,
        });

        expect(res.status).to.equal(400);
        expect(res.body.error.message).to.include('"password" is required');
      });
    });
  });
});
