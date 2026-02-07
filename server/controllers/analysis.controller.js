import Analysis from "../models/Analysis.js";
import Game from "../models/Game.js";

export const saveAnalysis = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { moves } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!moves || !Array.isArray(moves)) {
      return res.status(400).json({ error: "Invalid analysis payload" });
    }

    const game = await Game.findOne({ _id: gameId, ownerId: req.userId });

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const existing = await Analysis.findOne({ gameId });

    if (existing) {
      return res.status(409).json({ error: "Analysis already exists" });
    }

    const analysis = new Analysis({
      gameId,
      ownerId: req.userId,
      moves
    });

    await analysis.save();
    game.status = "analyzed";
    await game.save();

    res.status(201).json(analysis);
  } catch (err) {
    console.error("Save analysis error:", err);
    res.status(500).json({ error: "Failed to save analysis" });
  }
};
