import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

interface Friend {
    name: string;
    lastContacted: Date | null;
}

interface AppState {
    lastSelectedIndex: number | undefined;
    confirmationPending: boolean;
}

interface FriendsData {
    friends: Friend[];
    appState: AppState;
}

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const friendsFilePath = path.join(__dirname, 'friends.json');


// Helper function to read data from the file
function readDataFromFile(): Promise<FriendsData> {
    return new Promise((resolve, reject) => {
        fs.readFile(friendsFilePath, 'utf8', (err, data) => {
            if (err) {
                return reject('Failed to read data');
            }
            resolve(JSON.parse(data) as FriendsData);
        });
    });
}

// Helper function to write data to the file
function writeDataToFile(data: FriendsData): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(friendsFilePath, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                return reject('Failed to save data');
            }
            resolve();
        });
    });
}

// Endpoint to get friends and app state
app.get('/data', async (req: Request, res: Response) => {
    try {
        const data = await readDataFromFile();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Endpoint to add or update a friend and/or app state
app.post('/data', async (req: Request, res: Response) => {
    try {
        const newData = req.body as FriendsData;
        await writeDataToFile(newData);
        res.json({ message: 'Data saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
