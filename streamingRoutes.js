const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const webrtc = require("wrtc");
const Stream = require("../models/stream");

const streams = new Map();

function generateStreamId() {
  return Math.random().toString(36).substring(2, 10);
}

const checkStreamExists = (req, res, next) => {
  const { streamId } = req.body;
  if (streamId && !streams.has(streamId)) {
    return res.status(404).json({ error: "Stream not found" });
  }
  next();
};

// ========================
// WEBRTC SIGNALING ROUTES
// ========================

router.post("/broadcast", async (req, res) => {
  try {
    const streamId = generateStreamId();
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    const stream = new webrtc.MediaStream();
    streams.set(streamId, { peer, stream });

    peer.ontrack = (e) => {
      console.log("Broadcaster added track:", e.track.kind);
      e.streams[0].getTracks().forEach(track => {
        stream.addTrack(track);
      });
    };

    const desc = new webrtc.RTCSessionDescription(req.body.sdp);
    await peer.setRemoteDescription(desc);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    console.log(`Broadcasting started with streamId: ${streamId}`);

    res.json({
      sdp: peer.localDescription,
      streamId: streamId
    });
  } catch (error) {
    console.error("Error in /broadcast:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/consumer', checkStreamExists, async (req, res) => {
  try {
    const { streamId } = req.body;
    const streamData = streams.get(streamId);

    const peer = new webrtc.RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    const desc = new webrtc.RTCSessionDescription(req.body.sdp);
    await peer.setRemoteDescription(desc);

    if (streamData.stream.getTracks().length === 0) {
      console.log("Warning: No tracks in stream to forward");
    } else {
      console.log(`Forwarding ${streamData.stream.getTracks().length} tracks to viewer`);
      streamData.stream.getTracks().forEach(track => {
        peer.addTrack(track, streamData.stream);
      });
    }

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    console.log(`Viewer connected to streamId: ${streamId}`);

    res.json({
      sdp: peer.localDescription
    });
  } catch (error) {
    console.error("Error in /consumer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ========================
// STREAM CRUD ROUTES
// ========================

// 1. Start a new stream
router.post("/", async (req, res) => {
  try {
    const { userId, username, title, description,thumbnail,streamId } = req.body;

    const stream = new Stream({
      user: userId,
      username,
      title,
      description,
      thumbnail,
      streamId,
    });

    await stream.save();
    res.status(201).json({ message: "Stream started successfully!", stream });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get all live streams
router.get("/live", async (req, res) => {
  try {
    const liveStreams = await Stream.find({ isLive: true }).populate("user", "username");
    res.status(200).json(liveStreams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get all ended streams
router.get("/ended", async (req, res) => {
  try {
    const endedStreams = await Stream.find({ isLive: false }).populate("user", "username");
    res.status(200).json(endedStreams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. End a stream
router.put("/:streamId/end", async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await Stream.findOne({ streamId: req.params.streamId })
    if (!stream || !stream.isLive) {
      return res.status(404).json({ message: "Live stream not found!" });
    }

    stream.isLive = false;
    stream.endedAt = new Date();
    stream.duration = Math.floor((stream.endedAt - stream.startedAt) / 1000); // Calculate duration in seconds
    await stream.save();

    res.status(200).json({ message: "Stream ended successfully!", stream });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Like a stream
router.put("/:streamId/like", async (req, res) => {
    try {
      const { userId } = req.body;  
      const stream = await Stream.findOne({ streamId: req.params.streamId })
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found!" });
      }
  
      // Check if the user already liked the stream by searching for the userId in the likes array
      const userAlreadyLiked = stream.likes.some(like => like.userId === userId);
  
      if (userAlreadyLiked) {
        return res.status(400).json({ message: "Already liked this stream!" });
      }
  
      // Add the userId to the likes array if not already liked
      stream.likes.push({ userId });
  
      await stream.save();
      res.status(200).json({ message: "Stream liked successfully!", likes: stream.likes.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
// 6. Unlike a stream
router.put("/:streamId/unlike", async (req, res) => {
    try {
      const { userId } = req.body;  // Get userId from request body
      const stream = await Stream.findOne({ streamId: req.params.streamId })
  
      if (!stream) {
        return res.status(404).json({ message: "Stream not found!" });
      }
  
      // Remove the userId from the likes array
      stream.likes = stream.likes.filter(like => like.userId !== userId);
  
      await stream.save();
  
      res.status(200).json({ message: "Stream unliked successfully!", likes: stream.likes.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

// 7. Add a comment to a stream
router.post("/:streamId/comment", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const stream = await Stream.findOne({ streamId: req.params.streamId })
    if (!stream) {
      return res.status(404).json({ message: "Stream not found!" });
    }

    stream.comments.push({ user: userId, text });
    await stream.save();
    res.status(201).json({ message: "Comment added successfully!", comments: stream.comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Get a stream's details (with comments and likes)
router.get("/:streamId", async (req, res) => {
  try {
    const stream = await Stream.findOne({ streamId: req.params.streamId })
      .populate("user")
      .populate({
        path: "comments",
      });

    if (!stream) {
      return res.status(404).json({ message: "Stream not found!" });
    }

    res.status(200).json(stream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Delete a comment from a stream
router.delete("/:streamId/comment/:commentId", async (req, res) => {
  try {
    const stream = await Stream.findOne({ streamId: req.params.streamId })
    if (!stream) {
      return res.status(404).json({ message: "Stream not found!" });
    }

    const comment = stream.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found!" });
    }

    comment.remove();
    await stream.save();

    res.status(200).json({ message: "Comment deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
