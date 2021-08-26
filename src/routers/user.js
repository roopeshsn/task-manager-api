const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const auth = require("../middleware/auth");
const router = new express.Router();

// Create user
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
  // user
  //   .save()
  //   .then(() => {
  //     res.status(201).send(user);
  //   })
  //   .catch((error) => {
  //     res.status(400).send(error);
  //   });
});

// Read user profile
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// Read user by id
router.get("/users/:id", async (req, res) => {
  const _id = req.params.id;
  if (_id.length !== 24) return res.status(404).send();
  // async await version
  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
  // Promise version
  // if (_id.length !== 24) return res.status(404).send();
  // User.findById(_id)
  //   .then((user) => {
  //     if (!user) {
  //       return res.status(404).send();
  //     }
  //     res.send(user);
  //   })
  //   .catch((error) => {
  //     res.status(500).send(error);
  //   });
});

// Update user by id
router.patch("/users/me", auth, async (req, res) => {
  // extra validation
  const updates = Object.keys(req.body);
  const acceptedUpdates = ["name", "age", "email", "password"];
  const isValidOperation = updates.every((update) => {
    return acceptedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const user = await req.user;
    updates.forEach((update) => {
      user[update] = req.body[update];
    });
    await user.save();

    // if (!user) {
    //   return res.status(404).send();
    // }

    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete user by id
router.delete("/users/me", auth, async (req, res) => {
  try {
    // const user = await User.findByIdAndDelete(req.user._id);
    // if (!user) {
    //   res.status(404).send();
    // }
    await req.user.remove();
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// login user
router.post("/users/login", async (req, res) => {
  try {
    // Authentication
    const user = await User.findByCredentials(req.body.email, req.body.password);
    // Authorization
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(404).send(error);
  }
});

// logout user
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

// upload user avatar
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    // req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get("/users/:id/avatar", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/jpg");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;
