import Board from "../models/board.model.js";
import Pin from "../models/pin.model.js";

export const getCurrentUserBoards = async (req, res) => {
  try {
    const userId = req.userId;
    
    const boards = await Board.find({ user: userId });

    const boardsWithPinDetails = await Promise.all(
      boards.map(async (board) => {
        const pinCount = await Pin.countDocuments({ board: board._id });
        const firstPin = await Pin.findOne({ board: board._id });

        return {
          ...board.toObject(),
          pinCount,
          firstPin,
        };
      })
    );

    res.status(200).json(boardsWithPinDetails);
  } catch (error) {
    console.error("Error fetching current user boards:", error);
    res.status(500).json({ message: "Failed to fetch boards", error: error.message });
  }
};

export const getUserBoards = async (req, res) => {
  try {
    const { userId } = req.params;

    const boards = await Board.find({ user: userId });

    const boardsWithPinDetails = await Promise.all(
      boards.map(async (board) => {
        const pinCount = await Pin.countDocuments({ board: board._id });
        const firstPin = await Pin.findOne({ board: board._id });

        return {
          ...board.toObject(),
          pinCount,
          firstPin,
        };
      })
    );

    res.status(200).json(boardsWithPinDetails);
  } catch (error) {
    console.error("Error fetching user boards:", error);
    res.status(500).json({ message: "Failed to fetch boards", error: error.message });
  }
};
