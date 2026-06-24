import { useState } from "react";
import { EMPTY, MAX_TOURNAMENT_HISTORY } from "../../config/config.js";
import "./TournamentHistoryList.scss";

import FavoriteIcon from "../../assets/fav.svg?react";
import ExportIcon from "../../assets/export.svg?react";
import LoadIcon from "../../assets/load.svg?react";
import DeleteIcon from "../../assets/delete.svg?react";

const TournamentHistoryList = ({
                                   tournaments,
                                   toggleFavorite,
                                   handleLoadTournament,
                                   handleSaveTournament,
                                   confirmDeleteTournament
                               }) => {

    const [isExpanded, setIsExpanded] = useState(false);
    const ICON_SIZE = 22;

    return (
        <div className="history-container">
            <button 
                className="stats-value history-toggle-btn" 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span>{tournaments ? tournaments.length : 0}/{MAX_TOURNAMENT_HISTORY} tournois récents</span>
                <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
            </button>

            {isExpanded && (
                <ul className="history-list">
                    {
                tournaments.map((tournament, index) => {
                    const participants = tournament.participants || tournament.participantNames || [];
                    const participantsCount = Array.isArray(participants) ? participants.length : 0;
                    const tournamentDate = tournament.date || "Date inconnue";
                    const heap = Array.isArray(tournament.heap) ? tournament.heap : [];
                    const heapValue = heap.length > 0 ? heap[0] : null;
                    const isSaved = !!tournament.isSaved;

                    let showWinnerText = heapValue !== null &&
                        heapValue !== "EXEMPT" &&
                        heapValue !== "EMPTY" &&
                        heapValue !== "";

                    let winnerText = 'En cours...';
                    if (showWinnerText) {
                        if (heapValue === EMPTY) {
                            winnerText = 'En cours...';
                        } else if (typeof heapValue === 'string' && !isNaN(heapValue.trim())) {
                            winnerText = 'Winner: Team ' + heapValue.trim();
                        } else if (heapValue) {
                            winnerText = 'Winner: ' + heapValue;
                        }
                    }

                    return (
                        <li
                            key={index}
                            className={`history-item ${isSaved ? 'saved-history-item' : ''}`}
                        >
                            <div className="history-item-content">
                                <div className="history-item-title-container">
                                    <strong className="history-item-title">
                                        Tournoi du {tournamentDate}
                                    </strong>
                                    <button
                                        className="pixel-btn load-button title-load-button"
                                        onClick={() => handleLoadTournament(index)}
                                        title="Charger ce tournoi"
                                    >
                                        <LoadIcon width={ICON_SIZE} height={ICON_SIZE}/>
                                    </button>
                                </div>

                                <span className="history-item-participants">
                                {participantsCount} participants
                            </span>

                                {showWinnerText && (
                                    <span className="history-item-winner">{winnerText}</span>
                                )}
                            </div>

                            <div className="history-item-actions">
                                <button
                                    className="pixel-btn favorite-button"
                                    onClick={() => toggleFavorite(index)}
                                    title={isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
                                >
                                    <FavoriteIcon width={ICON_SIZE} height={ICON_SIZE}/>
                                </button>

                                <button
                                    className="pixel-btn export-btn"
                                    onClick={() => handleSaveTournament(index)}
                                    title="Exporter le tournoi au format JSON"
                                >
                                    <ExportIcon width={ICON_SIZE} height={ICON_SIZE}/>
                                </button>

                                <button
                                    className="pixel-btn delete-button"
                                    onClick={() => confirmDeleteTournament(index)}
                                    title="Supprimer ce tournoi de l'historique"
                                >
                                    <DeleteIcon width={ICON_SIZE} height={ICON_SIZE}/>
                                </button>
                            </div>
                        </li>
                    );
                })
            }
                </ul>
            )}
        </div>
    );
};

export default TournamentHistoryList;
