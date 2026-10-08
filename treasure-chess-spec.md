# Treasure Chess Specification

## 1. Overview
Treasure Chess is a free, browser-based chess variant in which players draft and arrange custom armies of fairy pieces before playing on a standard 8×8 chessboard.

Each player receives a treasury of 40 gold to purchase pieces from an expanded roster. Players must fill their pawn row, select a King, and purchase at least one additional back-rank piece. The remaining army composition and placement are customizable.

The core experience is **Draft → Place → Play**.

The application supports two local players on one device or one player against a basic computer opponent. No accounts, backend, or server-side data storage are required.

### Product principles
- **Simple:** Minimal UI, familiar chess interactions, no unnecessary features.
- **Fast:** Easy to start a game using preset or custom armies.
- **Approachable:** Piece movements and game rules are easy to discover.
- **Quiet:** Minimal animation, sound, and medieval branding.
- **Private:** No accounts, tracking, ads, or paywall.
- **Portable:** Responsive across desktop and mobile browsers.

## 2. Game Rules

### 2.1 General
- Two players, White and Black, play on a standard 8×8 chessboard.
- White moves first; players alternate turns.
- Standard chess rules for check, checkmate, stalemate, and draws apply except where modified below.
- Castling and en passant are not permitted.
- Kings cannot be captured or moved into check.
- No game clock is used.

### 2.2 Army Construction
Each player receives a treasury of **40 gold**.
- Every army must contain exactly one King, costing 1 gold.
- All eight squares of the pawn row must be filled.
- Players may freely mix the three available pawn types.
- Each army must contain at least one non-King, non-pawn piece on its back rank.
- Players may purchase multiple copies of any piece, subject to treasury and placement constraints.
- Players may leave back-rank squares empty.
- Unspent gold is permitted but provides no benefit.
- Purchased pieces must fit within their designated starting ranks.

White's starting ranks are 1 and 2; Black's are 8 and 7.

### 2.3 Deployment
- After drafting, each player arranges their purchased pieces.
- Pawns occupy the pawn row; other pieces occupy the back rank.
- White's King must start on d1 or e1.
- Black's King must start on d8 or e8.
- All other back-rank pieces may occupy any available back-rank square.
- Players draft and deploy privately, then reveal their completed armies simultaneously.
- No changes are permitted after both armies are locked.

### 2.4 Piece Catalog
Notation letters are unique identifiers. Traditional chess notation letters are preserved.
| Family | Piece | Symbol | Gold | Movement and capture |
|---|---|---|---:|---|
| Infantry | Pawn | P | 1 | Standard chess pawn |
| Infantry | Scout | S | 1 | Moves diagonally forward; captures straight forward |
| Infantry | Sergeant | G | 2 | Moves and captures one square in any forward direction |
| Rook | Bastion | T | 3 | One or two squares orthogonally; can jump |
| Rook | Rook | R | 5 | Standard chess rook |
| Rook | Gryphon | Y | 6 | One diagonal step, then outward orthogonal sliding |
| Bishop | Priest | I | 2 | One or two squares diagonally; can jump |
| Bishop | Bishop | B | 3 | Standard chess bishop |
| Bishop | Cardinal | C | 5 | One orthogonal step, then outward diagonal sliding |
| Knight | Camel | M | 2 | (1,3) jumper |
| Knight | Knight | N | 3 | Standard chess knight |
| Knight | Elephant | E | 6 | Knight + Camel movements |
| Royalty | Consort | O | 3 | One square in any direction |
| Royalty | Falconer | F | 8 | Jumps exactly two squares away: orthogonal, diagonal, or knightwise |
| Royalty | Queen | Q | 9 | Standard chess queen |
| Royalty | King | K | 1 | Standard chess king, without castling |

#### Movement Details
- **Bastion and Priest:** Both may move one square normally or jump directly to a square two spaces away along their permitted directions. Jumping ignores intervening pieces.
- **Gryphon:** May move or capture one square diagonally. Alternatively, after an unobstructed diagonal step, it may continue outward along a perpendicular orthogonal line for any distance. It cannot jump or turn more than once.
- **Cardinal:** May move or capture one square orthogonally. Alternatively, after an unobstructed orthogonal step, it may continue outward along a diagonal line for any distance. It cannot jump or turn more than once.
- **Gryphon/Cardinal:** A capture on the first square ends the move. For longer moves, the turning square and all intermediate squares must be empty.
- **Falconer:** Can jump to any square with an offset of (0,2), (2,0), (1,2), (2,1), or (2,2), including sign variations. It cannot move to adjacent squares.
- **Jumping pieces:** May jump over friendly or enemy pieces, but may land only on an empty square or an enemy piece.

### 2.5 Pawn Rules
- All three pawn types move only forward.
- Pawns may move one square or, on their first move from their starting square, two squares.
- A two-square move must follow one direction throughout, with both the intermediate and destination squares empty.
- A Pawn's initial double move is straight forward.
- A Scout's initial double move may be diagonally forward in either direction.
- A Sergeant's initial double move may be straight or diagonally forward.
- Captures follow each pawn type's normal capture pattern and are never permitted as part of a double move.
- En passant is not permitted.

### 2.6 Promotion
- Promotion is mandatory when a pawn reaches the opponent's back rank.
- A pawn may promote to any non-King, non-pawn piece type in its player's original starting army.
- A piece type remains eligible even if all original pieces of that type have been captured.
- Multiple pawns may promote to the same piece type.
- Promotion does not consume gold.

### 2.7 Check, Victory, and Draws
- Standard chess rules for check and legal King movement apply.
- Checkmate ends the game with a victory for the attacking player.
- A player may resign at any time.
- Stalemate is a draw.
- Threefold repetition and the 50-move rule are supported, following standard chess claim semantics.
- Fivefold repetition and the 75-move rule produce automatic draws under standard FIDE conventions.
- Dead positions are drawn when neither player can possibly deliver checkmate. Detection must account for fairy-piece movements; uncertain material combinations must not be declared drawn automatically.

### 2.8 Deferred Pieces
The following pieces are excluded from v1 but may be introduced later:
- **Jester:** Swaps positions with any friendly non-King piece anywhere on the board.
- **Viper:** Moves like a Queen without capturing and paralyzes adjacent enemy pieces, including Kings. Paralyzed pieces cannot move or give check.

## 3. Product Requirements

### 3.1 Game Modes
**Local multiplayer**
- Two players share one device and browser session.
- Each player drafts and deploys independently.
- A handoff screen conceals the previous player's choices.
- Players alternate moves on the same board.

**Single-player**
- One human plays against a basic computer opponent.
- The human may use a preset army or draft a custom army.
- The computer uses a player-selected preset army and formation.
- The computer must generate legal moves and provide a reasonable basic challenge.
- Advanced AI, opening books, and difficulty settings are not required for v1.

### 3.2 Core Screens
**Home**
- New Game
- Continue Game, when a saved local session exists
- Rules
- Select local multiplayer or computer opponent

**Draft**
- Display all pieces, grouped by family.
- Show each piece's name, symbol, cost, and movement reference.
- Allow players to add and remove pieces.
- Display treasury expenditure and remaining gold.
- Validate all army construction constraints.
- Offer preset armies for quick starting.

**Place**
- Display the chessboard and available pieces.
- Allow tap/click or drag-and-drop placement.
- Enforce pawn-rank and King-position restrictions.
- Support random valid placement.
- Allow repositioning before locking the army.
- Advance to play when both armies are ready.

**Play**
- Display the board, current turn, and game status.
- Support piece selection and legal move execution.
- Highlight legal moves and captures when a friendly piece is selected.
- Allow inspection of an opposing piece's movement and attack pattern.
- Display selected pieces, the previous move, and check.
- Present eligible promotion options when required.
- Provide Undo, Resign, New Game, and Rules controls.
- Show a game result when play ends.
- Support optional move history.

**Rules**
- Provide a concise explanation of army construction, deployment, movement, promotion, and victory conditions.
- Display all pieces with movement diagrams.
- Remain accessible throughout the game without losing progress.

### 3.3 Interaction Rules
- Primary movement interaction is tap/click a piece, then tap/click a legal destination.
- Drag-and-drop may be supported as an additional interaction.
- Selecting another friendly piece changes selection.
- Selecting the selected piece again clears selection.
- Illegal moves do not alter game state.
- An Undo in local multiplayer reverses one half-move.
- An Undo against the computer reverses the human move and the computer response, where available.
- Undo restores all relevant state, including promotion and draw counters.
- Starting a new game during an active session requires confirmation.
- No chess clock or time limits are displayed.

### 3.4 Session Persistence
- Automatically save the current session in browser local storage.
- Restore an unfinished draft, deployment, or game after refresh.
- Maintain one current session per browser.
- Persist armies, game mode, setup phase, board state, move history, and relevant settings.
- Include a saved-state schema version for compatibility handling.
- Provide a way to clear or replace the current session.
- No server-side game storage or cross-device synchronization.

## 4. Non-Functional Requirements
| Area | Requirement |
|---|---|
| Platforms | Modern desktop and mobile browsers |
| Performance | Fast load, responsive moves, non-blocking computer calculation |
| Layout | Responsive; entire chessboard visible without horizontal scrolling |
| Accessibility | Keyboard support, labeled controls, clear contrast, non-color-only indicators |
| Design | Clean, minimal, chess-first visual language |
| Animation | Minimal; respect reduced-motion preferences |
| Sound | Not required; off by default if included |
| Privacy | No accounts, ads, tracking, or analytics |
| Reliability | Deterministic rules and reproducible game state |
| Hosting | GitHub and Vercel |
| Cost | Free to play, with no paywall |

## 5. Technical Architecture
Use a lightweight TypeScript monorepo.

**Recommended stack**
- React, TypeScript, and Vite for the web application.
- A separate pure TypeScript package for game rules.
- A browser-based computer opponent using minimax/alpha-beta search.
- Web Worker for computer calculations.
- Browser `localStorage` for session persistence.
- GitHub for source control and Vercel for deployment.

**Suggested structure**
```text
treasure-chess/
├── apps/
│   └── web/
├── packages/
│   └── game/
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

The game package is responsible for piece definitions, movement generation, army validation, legal moves, check detection, promotion, game termination, and computer search.

The web application is responsible for presentation, user interactions, local session persistence, and rules documentation.

Game logic must remain independent of the browser UI so it can be tested without rendering the application.

## 6. Out of Scope
The following are explicitly excluded from v1:
- Accounts, authentication, and user profiles
- Online multiplayer or matchmaking
- Leaderboards, ratings, or achievements
- Multiple saved games or cloud synchronization
- Advanced computer analysis or opening books
- Timers and competitive time controls
- Advertising, payments, or subscriptions
- Chat and social features
- Extensive animations, sound, or fantasy branding
- Jester and Viper mechanics

## 7. Release Criteria
Treasure Chess v1 is ready when:
1. Players can draft valid armies within 40 gold.
2. Players can deploy their armies according to the placement rules.
3. All 16 included piece types move and capture correctly.
4. Pawn movement and promotion behave as specified.
5. Check, checkmate, stalemate, and draw conditions are correctly enforced.
6. Two local players can complete a game.
7. A player can complete a game against a basic computer.
8. Piece movements and legal destinations are easily inspectable.
9. Undo works correctly in both game modes.
10. Browser refresh restores the current session.
11. The experience works reliably on desktop and mobile.
12. The application deploys automatically from GitHub to Vercel.

## 8. Implementation Priorities
**Phase 1 — Game engine:** Piece definitions, movement, army validation, legal moves, promotion, and game endings. Comprehensive automated tests.

**Phase 2 — Local multiplayer:** Drafting, deployment, playable board, rules reference, undo, and browser persistence.

**Phase 3 — Computer opponent:** Preset armies, basic search and evaluation, and background calculation.

**Phase 4 — Release:** Mobile and desktop refinement, accessibility, game testing, and production deployment.
