# BGU Course Catalog Scraper

A Node.js tool to scrape course data (ID, Name, Points) from the BGU4U Oracle PL/SQL catalog.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

## Running the Scraper

To execute the scraping script:
```bash
node scrape.js
```

The script will:
1. Initialize a session with the BGU server.
2. Fetch the course catalog for department 202 (Computer Science).
3. Decode the `win1255` encoded response.
4. Save the extracted data to `courses.json`.

## Stopping the Scraper

- **Manual Stop:** If the script is running in your terminal, press `Ctrl + C` to terminate it.
- **Background Process:** If you ran it in the background, find the PID and kill it:
  ```bash
  ps aux | grep node
  kill <PID>
  ```

## Output

The results are saved in `courses.json` in the following format:
```json
[
  {
    "id": "202.1.1234",
    "name": "Course Name",
    "points": "3.5"
  }
]
```
