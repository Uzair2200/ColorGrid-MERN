import SignupSchema from "../models/loginSignup.js";

// Creating a new player
export const createPlayer = async function (req, res) {
    const { player, password, profilePictureUrl } = req.body;
    try {
        const playerFound = await SignupSchema.findOne({ PlayerName: player });
        if (playerFound) {
            res.status(400).json({ error: "Username already exists" });
            return;
        }

        // Create new player with 1000 coins as per requirements
        const newPlayer = await SignupSchema.create({
            PlayerName: player,
            password: password,
            coins: 1000,
            profilePictureUrl: profilePictureUrl || undefined
        });

        // Return player data without password
        const playerData = {
            _id: newPlayer._id,
            PlayerName: newPlayer.PlayerName,
            coins: newPlayer.coins,
            profilePictureUrl: newPlayer.profilePictureUrl,
            wins: newPlayer.wins,
            losses: newPlayer.losses,
            draws: newPlayer.draws
        };

        res.status(201).json(playerData);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

// Finding a player for login
export const findPlayer = async function (req, res) {
    const { player, password } = req.body;
    try {
        const playerFound = await SignupSchema.findOne({ PlayerName: player, password: password });
        if (!playerFound) {
            res.status(401).json({ error: "Invalid username or password" });
            return;
        }

        // Return player data without password
        const playerData = {
            _id: playerFound._id,
            PlayerName: playerFound.PlayerName,
            coins: playerFound.coins,
            profilePictureUrl: playerFound.profilePictureUrl,
            wins: playerFound.wins,
            losses: playerFound.losses,
            draws: playerFound.draws
        };

        res.status(200).json(playerData);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

// Update player profile
export const updatePlayer = async function (req, res) {
    const { id } = req.params;
    const { PlayerName, password, profilePictureUrl } = req.body;

    try {
        // Check if username is taken by another user
        if (PlayerName) {
            const existingPlayer = await SignupSchema.findOne({
                PlayerName,
                _id: { $ne: id }
            });

            if (existingPlayer) {
                res.status(400).json({ error: "Username already taken" });
                return;
            }
        }

        // Update the player
        const updatedPlayer = await SignupSchema.findByIdAndUpdate(
            id,
            {
                ...(PlayerName && { PlayerName }),
                ...(password && { password }),
                ...(profilePictureUrl !== undefined && { profilePictureUrl })
            },
            { new: true }
        );

        if (!updatedPlayer) {
            res.status(404).json({ error: "Player not found" });
            return;
        }

        // Return updated player data without password
        const playerData = {
            _id: updatedPlayer._id,
            PlayerName: updatedPlayer.PlayerName,
            coins: updatedPlayer.coins,
            profilePictureUrl: updatedPlayer.profilePictureUrl,
            wins: updatedPlayer.wins,
            losses: updatedPlayer.losses,
            draws: updatedPlayer.draws
        };

        res.status(200).json(playerData);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}
//  getting all players

// export const getPlayers = async (req,res) => {
//     const players= await testingschema.find({})
//     res.status(200).json(players)
// }

// export const deletcePlayer = async (req,res) => {
//     const {name,level} = req.body
//     const deletedPlayer= await testingschema.findOneAndUpdate({player:name},{...req.body})
//     if (deletedPlayer) {
//         res.status(200).json({msg:"DONE"})
//     }
//     else{
//         res.status(400).json({msg:"player not found"})
//     }
// }