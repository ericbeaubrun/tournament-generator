import {useCallback, useEffect, useRef, useState} from "react";
import "./Home.scss";
import Tournament from "./Tournament.jsx";
import {EMPTY, MAX_TOURNAMENT_HISTORY} from "../config/config.js";
import ConfirmDialog from "./dialog/ConfirmDialog.jsx";
import TournamentHistoryList from "./history/TournamentHistoryList.jsx";
import Header from "./Header.jsx";
import {downloadJSON} from "../utils/fileUtils.js";

export default function Home() {

    const [, setClearHistoryFunction] = useState(null);
    const [, setLoadTournamentFunction] = useState(null);
    const [, setHistorySynchronized] = useState(false);
    const [, setShowConfirmSavedReset] = useState(false);
    const [, setShowConfirmUnsavedReset] = useState(false);

    const [showSetup, setShowSetup] = useState(false);
    const [tournamentToDelete, setTournamentToDelete] = useState(null);
    const hasClearFunctionBeenSet = useRef(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [archivedTournaments, setArchivedTournaments] = useState([]);

    const handleGetArchivedTournaments = useCallback((tournaments) => {
        if (tournaments) {
            setArchivedTournaments(tournaments);
            setHistorySynchronized(true);
        }
    }, []);

    const handleGetLoadTournament = useCallback((loadFunction) => {
        setLoadTournamentFunction(loadFunction);
    }, []);

    const handleGetClearHistory = useCallback((clearFunction) => {
        if (!hasClearFunctionBeenSet.current) {
            setClearHistoryFunction(clearFunction);
            hasClearFunctionBeenSet.current = true;
        }
    }, []);

    useEffect(() => {
        const handleHistoryLoaded = (event) => {
            const {tournaments} = event.detail;
            if (tournaments && tournaments.length > 0) {
                setArchivedTournaments(tournaments);
                setHistorySynchronized(true);
            }
        };

        window.addEventListener('setup-history-loaded', handleHistoryLoaded);

        return () => {
            window.removeEventListener('setup-history-loaded', handleHistoryLoaded);
        };
    }, []);

    useEffect(() => {
        const handleHistoryCleared = () => {
            setArchivedTournaments([]);
        };

        window.addEventListener('setup-history-cleared', handleHistoryCleared);

        return () => {
            window.removeEventListener('setup-history-cleared', handleHistoryCleared);
        };
    }, []);

    useCallback(() => {
        try {
            const savedTournaments = archivedTournaments.filter(t => t.isSaved);
            setArchivedTournaments(savedTournaments);

            localStorage.setItem("tournamentHistory", JSON.stringify(savedTournaments));

        } catch (e) {
            //TODO
            console.error(e);
        }
    }, [archivedTournaments]);

    const handleResetHistory = useCallback(() => {
        setShowConfirmReset(true);
        setShowConfirmSavedReset(false);
        setShowConfirmUnsavedReset(false);
    }, []);

    const handleCancelReset = useCallback(() => {
        setShowConfirmReset(false);
        setShowConfirmSavedReset(false);
        setShowConfirmUnsavedReset(false);
    }, []);

    const [, setSave] = useState(null);

    const handleGetSave = useCallback((saveFunction) => {
        setSave(saveFunction);
    }, []);

    const confirmDel = useCallback((index) => {
        setTournamentToDelete(index);
    }, []);

    const cancelDel = useCallback(() => {
        setTournamentToDelete(null);
    }, []);

    const [tournamentToLoad, setTournamentToLoad] = useState(null);
    const lastLoadedTournamentRef = useRef(null);


    //TODO
    const handleSave = useCallback((index) => {
        if (archivedTournaments[index]) {
            const tournament = archivedTournaments[index];
            const filename = `tournoi_${tournament.date.replace(/[\/\s:]/g, "_")}.json`;
            downloadJSON(tournament, filename);
        }
    }, [archivedTournaments]);

    const toggleFavorite = useCallback((index) => {
        if (index >= 0 && index < archivedTournaments.length) {
            try {
                const updatedTournaments = [...archivedTournaments];

                updatedTournaments[index] = {
                    ...updatedTournaments[index],
                    isSaved: !updatedTournaments[index].isSaved,
                    savedAt: updatedTournaments[index].isSaved ? null : new Date().toISOString()
                };

                setArchivedTournaments(updatedTournaments);
                localStorage.setItem("tournamentHistory", JSON.stringify(updatedTournaments));

            } catch (e) {
                //TODO
                console.error(e)
            }
        }
    }, [archivedTournaments]);


    const deleteTournament = useCallback(() => {
        if (tournamentToDelete !== null && tournamentToDelete >= 0 && tournamentToDelete < archivedTournaments.length) {
            try {
                const updatedTournaments = archivedTournaments.filter((_, i) => i !== tournamentToDelete);

                setArchivedTournaments(updatedTournaments);
                localStorage.setItem("tournamentHistory", JSON.stringify(updatedTournaments));
                setTournamentToDelete(null);
            } catch (e) {
                //TODO
                console.error(e)
            }
        }
    }, [archivedTournaments, tournamentToDelete]);


    const handleLoad = useCallback((index) => {
        if (lastLoadedTournamentRef.current === index) return;

        if (index !== undefined && Number.isInteger(Number(index))) {
            lastLoadedTournamentRef.current = index;
            setTournamentToLoad(index);
            setShowSetup(true);
        }
    }, []);

    useEffect(() => {
        if (!showSetup) {
            lastLoadedTournamentRef.current = null;
            setTournamentToLoad(null);
        }
    }, [showSetup]);

    // TODO
    const importTournament = useCallback(() => {
        const file = document.createElement('input');
        file.type = 'file';
        file.accept = '.json';

        file.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const tournamentData = JSON.parse(e.target.result);

                    const hasHeap = Array.isArray(tournamentData.heap);
                    const hasParticipants = Array.isArray(tournamentData.participants) || Array.isArray(tournamentData.participantNames);

                    if (hasHeap && hasParticipants) {
                        const participants = tournamentData.participants || tournamentData.participantNames || [];
                        const date = tournamentData.date || new Date().toISOString();
                        const newTournament = {
                            heap: tournamentData.heap,
                            participants: [...participants],
                            participantNames: [...participants],
                            winner: tournamentData.heap[0] !== EMPTY && tournamentData.heap[0] !== "" ? tournamentData.heap[0] : null,
                            date: date,
                            createdAt: date,
                            savedAt: new Date().toISOString(),
                            lastUpdated: new Date().toISOString(),
                            status: tournamentData.status || "importé",
                            isSaved: true,
                            isComplete: tournamentData.heap[0] !== EMPTY && tournamentData.heap[0] !== "",
                            displayName: file.name.replace(/\.json$/, ''),
                            lineCount: participants.length,
                            imported: true,
                            importDate: new Date().toISOString(),
                            fileName: file.name,
                            heapHistory: tournamentData.heapHistory || [tournamentData.heap],
                        };

                        const isAlreadyInHistory = archivedTournaments.some(
                            t => t.date === newTournament.date ||
                                (JSON.stringify(t.heap) === JSON.stringify(newTournament.heap) &&
                                    Array.isArray(t.participants) && JSON.stringify(t.participants) === JSON.stringify(newTournament.participants))
                        );

                        let updatedTournaments;
                        if (isAlreadyInHistory) {
                            updatedTournaments = archivedTournaments.map(t => (t.date === newTournament.date) ? newTournament : t);
                        } else {
                            updatedTournaments = [newTournament, ...archivedTournaments];
                        }

                        setArchivedTournaments(updatedTournaments);
                        localStorage.setItem("tournamentHistory", JSON.stringify(updatedTournaments));
                        lastLoadedTournamentRef.current = 0;
                        setTournamentToLoad(0);
                        setShowSetup(true);
                    }
                } catch (e) {
                    //TODO
                    console.error(e);
                }
            };

            reader.readAsText(file);
        });

        file.click();
    }, [archivedTournaments]);

    return (
        <div className="homepage-container">
            <Header
                onNavigateHome={() => setShowSetup(false)}
                onResetHistory={handleResetHistory}
                isConfirmDialogOpen={showConfirmReset}
                onConfirmReset={
                    () => {
                        window.dispatchEvent(
                            new CustomEvent('history-reset-requested', {
                                    detail: {complete: true}
                                }
                            )
                        );

                        localStorage.removeItem("tournamentHistory");
                        setArchivedTournaments([]);
                        setTournamentToLoad(null);
                        lastLoadedTournamentRef.current = null;
                        setShowConfirmReset(false);
                    }
                }
                onCancelReset={handleCancelReset}
                onImportTournament={importTournament}
            />

            <Tournament
                showSetup={true}
                getArchivedTournaments={handleGetArchivedTournaments}
                getLoadTournamentFunction={handleGetLoadTournament}
                getClearHistoryFunction={handleGetClearHistory}
                getSaveTournamentFunction={handleGetSave}
                tournamentToLoad={tournamentToLoad}
            />

            <TournamentHistoryList
                tournaments={archivedTournaments}
                toggleFavorite={toggleFavorite}
                handleLoadTournament={handleLoad}
                handleSaveTournament={handleSave}
                confirmDeleteTournament={confirmDel}
            />

            <ConfirmDialog
                isOpen={tournamentToDelete !== null}
                onConfirm={deleteTournament}
                onCancel={cancelDel}
            />
        </div>
    );
}
