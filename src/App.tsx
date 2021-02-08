import "./App.css";

import { ChessInstance, Move, Piece, PieceType, Square } from "chess.js";
import React, { CSSProperties, useState } from "react";

import Chessboard from "chessboardjsx";

interface BoardProps {
	game: ChessInstance;
}

function stringToPiece(stringPiece: String): Piece {
	return { color: stringPiece.charAt(1) === "w" ? "w" : "b", type: stringPiece.charAt(1).toLowerCase() as PieceType };
}

export const App: React.FC<BoardProps> = ({ game }) => {
	const [history, setHistory] = useState<Move[]>();
	const [fen, setFen] = useState("start");
	const [style, setStyle] = useState<{ [square in Square]?: CSSProperties }>();

	const handleDrop = (sourceSquare: Square, targetSquare: Square, piece: Piece) => {
		console.log(`source: ${sourceSquare}; targer: ${targetSquare};piece: ${piece} `);
		let move = game.move({ from: sourceSquare, to: targetSquare });

		// if legal move do that no other logic needed
		if (move) {
			setFen(game.fen());
			const newHistory = game.history({ verbose: true });
			setHistory(newHistory);
			setStyle(squareStyling(move.to, newHistory));
		} else {
			//Promotion handling
			if (piece.type === "p" && ((piece.color === "w" && targetSquare.charAt(1) === "8") || (piece.color === "b" && targetSquare.charAt(1) === "1"))) {
				console.log("promotion");
				do {
					move = game.move({ from: sourceSquare, to: targetSquare, promotion: selectPromotionTarget() });
				} while (!move);
			}
		}
	};

	const selectPromotionTarget = () => {
		//TODO Give player ability to select something else
		return game.QUEEN;
	};

	const showMoves = (s: Square) => {
		let moves = game.moves({ verbose: true, square: s });
		// moves.map(m => console.log(m));
		highlightSquare(moves);
	};

	const squareStyling = (pieceSquare: Square, history?: Move[]) => {
		const sourceSquare = history?.length && history[history.length - 1].from;
		const targetSquare = history?.length && history[history.length - 1].to;

		return {
			[pieceSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
			...(sourceSquare && {
				[sourceSquare]: {
					backgroundColor: "rgba(255, 255, 0, 0.4)",
				},
			}),
			...(targetSquare && {
				[targetSquare]: {
					backgroundColor: "rgba(255, 255, 0, 0.4)",
				},
			}),
		};
	};

	const highlightSquare = (squaresToHighlight: Move[]) => {
		let highlightStyles = [...squaresToHighlight].reduce((a, c) => {
			return {
				...a,
				...{
					[c.to]: {
						background: "radial-gradient(circle, #00000066 40%, transparent 43%)",
						borderRadius: "50%",
					},
				},
			};
		}, {});
		let m = history && history[history.length - 1];
		if (m) {
			highlightStyles = { ...highlightStyles, ...squareStyling(m.to, history) };
		}
		console.log(highlightStyles);
		setStyle(highlightStyles);
	};
	const gameOver = () => {
		let message = "";
		if (game.game_over()) {
			if (game.in_checkmate()) {
				message += `${game.turn() === "b" ? "Black" : "White"} in Checkmate`;
			} else if (game.in_stalemate()) {
				message = "Stalemate";
			} else if (game.in_threefold_repetition()) {
				message = "Threefold Repetition";
			} else if (game.insufficient_material()) {
				message = "Insufficient Material";
			} else if (game.in_draw()) {
				message = "Draw";
			}
		}
		return message;
	};

	return (
		<div className="App">
			<pre>{game.pgn()}</pre>
			<div>{game.game_over && gameOver()}</div>
			<Chessboard
				position={fen}
				onDrop={({ sourceSquare, targetSquare, piece }) => {
					handleDrop(sourceSquare, targetSquare, stringToPiece(piece));
				}}
				onSquareClick={s => showMoves(s)}
				squareStyles={style}
			/>
			<History history={history} />
		</div>
	);
};
interface HistoryProps {
	history?: Move[];
}
export const History: React.FC<HistoryProps> = ({ history }) => {
	return (
		<table>
			<tbody>
				{history &&
					history.map((r, k) => (
						<tr key={k}>
							<td>{r.from}</td>
							<td>{"->"}</td>
							<td>{r.to}</td>
							<td>{r.promotion}</td>
							<td>{r.san}</td>
						</tr>
					))}
			</tbody>
		</table>
	);
};

export default App;
