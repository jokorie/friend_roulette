var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(cors());
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const friendsFilePath = path.join(__dirname, 'friends.json');
// Helper function to read data from the file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile(friendsFilePath, 'utf8', (err, data) => {
            if (err) {
                return reject('Failed to read data');
            }
            resolve(JSON.parse(data));
        });
    });
}
// Helper function to write data to the file
function writeDataToFile(data) {
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
app.get('/data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield readDataFromFile();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
}));
// Endpoint to add or update a friend and/or app state
app.post('/data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newData = req.body;
        yield writeDataToFile(newData);
        res.json({ message: 'Data saved successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
}));
// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
