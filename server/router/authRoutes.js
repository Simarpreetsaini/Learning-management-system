const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router
    .route("/register")
    .post(authControllers.register);

router
    .route("/login")
    .post(authControllers.login);

router
    .route("/user")
    .get(authMiddleware, authControllers.user);

router
    .route("/users")
    .get(authMiddleware, authControllers.allUsers);

router
    .route("/users/:username")
    .get(authControllers.userByName);

router
    .route("/user/:id")
    .get(authControllers.userById);

router
    .route("/users/:id")
    .put(authMiddleware, authControllers.updateUser);

router
    .route("/users/:id")
    .delete(authMiddleware, authControllers.deleteUser);

router
    .route("/change-password")
    .put(authMiddleware, authControllers.changePassword);

module.exports = router;
