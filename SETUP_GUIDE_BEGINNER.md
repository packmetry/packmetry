# Packmetry — Beginner Setup Guide

This guide assumes your local repository already exists at:

`E:\packmetry`

and `git init -b main` has already been run successfully.

## What this foundation package does

It gives the repository one clear Packmetry authority hierarchy and prevents old CartonLab helper files from becoming active instructions.

The important rule is simple:

**Packmetry bootstrap first. Legacy CartonLab detail second. Old CartonLab helper prompts/rules do not control the new project.**

## Step 1 — Extract this package

1. Download the ZIP supplied by ChatGPT.
2. Right-click the ZIP in Windows Explorer.
3. Choose **Extract All...**.
4. Open the extracted `packmetry_foundation_v1` folder.
5. Press `Ctrl + A` to select everything inside it.
6. Press `Ctrl + C`.
7. Open `E:\packmetry`.
8. Press `Ctrl + V`.

Do not copy the outer `packmetry_foundation_v1` folder itself into the repo. Copy its **contents** so `README.md`, `.gitignore`, `.clinerules`, and `docs` sit directly under `E:\packmetry`.

## Step 2 — Confirm the structure in VS Code

Open `E:\packmetry` in VS Code. In Explorer you should see approximately:

```text
packmetry/
├── .clinerules/
├── docs/
├── .clineignore
├── .gitignore
├── CLINE_START_PROMPT.md
├── README.md
└── SETUP_GUIDE_BEGINNER.md
```

## Step 3 — Verify Git sees the files

In the VS Code terminal run:

```powershell
git status
```

Expected: the repository remains on branch `main`, and the new files appear as **Untracked files**. That is correct. Do not commit yet.

Then run:

```powershell
git diff --check
```

With only untracked files, this may produce no output. No output is good.

## Step 4 — Do NOT start Cline coding yet

At this stage Cline may inspect documentation only if specifically asked. Do not ask it to scaffold Astro, build the homepage, or implement the solver until the repository foundation has been reviewed.

## Step 5 — GitHub comes after local foundation review

After ChatGPT confirms the local structure, create an **empty** GitHub repository named `packmetry` and connect it as `origin`.

Do not initialize the GitHub repository with a README, `.gitignore`, or license because those files already exist locally.

## Safety

Never paste API keys/tokens into repository files. Never commit `.env` secrets. Cline/provider credentials stay in local tooling configuration, not Packmetry source code.
