import Review from '../models/Review.js'
import Analysis from '../models/Analysis.js'
import Game from '../models/Game.js'

export const generateReview = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const game = await Game.findOne({ _id: gameId, ownerId: req.userId });

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const analysis = await Analysis.findOne({ gameId });

    if (!analysis) {
      return res.status(400).json({ error: "Game not analyzed yet" });
    }

    const existing = await Review.findOne({ gameId });
    if (existing) {
      return res.status(409).json({ error: "Review already exists" });
    }

    //core logic to be written here 

    
    const review = new Review({
      gameId,
      ownerId: req.userId,
      summary,
      blunders,
      mistakes,
      goodMoves,
      accuracy
    })

    await review.save()
    res.status(201).json(review)
  }
  catch (error) {
    console.error("Generate review error:", error)
    res.status(500).json({ error: "Failed to generate review" })
  }
}

export const getReviewByGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const review = await Review.findOne({
      gameId,
      ownerId: req.userId
    });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (err) {
    console.error("Fetch review error:", err);
    res.status(500).json({ error: "Failed to fetch review" });
  }
}