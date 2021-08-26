const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();

// Create tasks
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    author: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Read tasks
// GET /tasks?completed=false
// GET /tasks?limit=3&skip=1
// GET /tasks?sortBy=createdAt:desc

router.get("/tasks", auth, async (req, res) => {
  const completed = {};
  const pageOptions = {};
  if (req.query.completed) {
    completed.completed = req.query.completed == "true";
  }
  // if (req.query.limit && req.query.skip) {
  //   pageOptions.limit = parseInt(req.query.limit);
  //   pageOptions.skip = parseInt(req.query.skip);
  // }
  try {
    const tasks = await Task.find({ author: req.user._id, ...completed }, null, {
      limit: req.query.limit,
      skip: req.query.skip,
    });
    res.send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Read task by id
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  if (_id.length !== 24) return res.status(404).send();
  try {
    const task = await Task.findOne({ _id, author: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update task by id
router.patch("/tasks/:id", auth, async (req, res) => {
  // extra validation
  const updates = Object.keys(req.body);
  const acceptedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) => {
    return acceptedUpdates.includes(update);
  });

  if (!isValidOperation) return res.status(400).send({ error: "Invalid updates!" });

  try {
    const task = await Task.findOne({ _id: req.params.id, author: req.user._id });
    if (!task) return res.status(404).send(error);
    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete task by id
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (!task) {
      res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
