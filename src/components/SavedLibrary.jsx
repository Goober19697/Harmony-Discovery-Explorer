import React, { useEffect, useRef, useState } from "react";
import {
  deleteSavedProgression,
  deleteSavedVoicing,
  getSavedProgressions,
  getSavedVoicings,
  updateProgression,
  updateSavedProgression,
} from "../services/api.js";
import { formatOrderedNotes } from "../noteParsing.js";
import {
  replaceSavedProgression,
  savedProgressionDisplaySteps,
  normalizeProgressionTitle,
} from "../savedProgressionDisplay.js";

function savedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export default function SavedLibrary({
  onRestoreVoicing,
  onRestoreProgression,
  onPlayVoicing,
  onPlayProgression,
  refreshKey = 0,
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("voicings");
  const [voicings, setVoicings] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [editingProgressionId, setEditingProgressionId] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [playingVoicingId, setPlayingVoicingId] = useState(null);
  const [playingProgressionId, setPlayingProgressionId] = useState(null);
  const renameInputRef = useRef(null);
  const renameInFlightRef = useRef(false);
  const skipRenameBlurRef = useRef(false);

  async function loadLibrary() {
    setLoading(true);
    setLoadError(null);
    try {
      const [voicingData, progressionData] = await Promise.all([
        getSavedVoicings(),
        getSavedProgressions(),
      ]);
      setVoicings(voicingData.voicings || []);
      setProgressions(progressionData.progressions || []);
    } catch (error) {
      setLoadError(error.message || "The Saved Library could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadLibrary();
  }, [open, refreshKey]);

  useEffect(() => {
    if (editingProgressionId !== null && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingProgressionId]);

  function beginRename(saved) {
    setEditingProgressionId(saved.id);
    setTitleDraft(saved.title || "Untitled Progression");
    setUpdateError(null);
  }

  async function saveRename(saved) {
    if (renameInFlightRef.current) return;
    const title = normalizeProgressionTitle(titleDraft);
    if (title === saved.title) {
      setEditingProgressionId(null);
      return;
    }

    renameInFlightRef.current = true;
    try {
      const result = await updateProgression(saved.id, { title });
      setProgressions(items => replaceSavedProgression(items, result.progression));
      setEditingProgressionId(null);
    } catch (error) {
      skipRenameBlurRef.current = false;
      setUpdateError(error.message || "The progression title could not be updated.");
    } finally {
      renameInFlightRef.current = false;
    }
  }

  async function playVoicing(saved) {
    if (playingVoicingId !== null) return;
    setPlayingVoicingId(saved.id);
    setUpdateError(null);
    try {
      await onPlayVoicing(saved);
    } catch (error) {
      setUpdateError(error.message || "The saved voicing could not be played.");
    } finally {
      setPlayingVoicingId(null);
    }
  }

  async function playProgression(saved) {
    if (playingProgressionId !== null) return;
    setPlayingProgressionId(saved.id);
    setUpdateError(null);
    try {
      await onPlayProgression(saved);
    } catch (error) {
      setUpdateError(error.message || "The saved progression could not be played.");
    } finally {
      setPlayingProgressionId(null);
    }
  }

  async function deleteVoicing(saved) {
    if (!window.confirm("Delete this saved voicing permanently?")) return;
    setUpdateError(null);
    try {
      await deleteSavedVoicing(saved.id);
      setVoicings(items => items.filter(item => item.id !== saved.id));
    } catch (error) {
      setUpdateError(error.message || "The saved voicing could not be deleted.");
    }
  }

  async function deleteProgression(saved) {
    if (!window.confirm("Delete this saved progression permanently?")) return;
    setUpdateError(null);
    try {
      await deleteSavedProgression(saved.id);
      setProgressions(items => items.filter(item => item.id !== saved.id));
    } catch (error) {
      setUpdateError(error.message || "The saved progression could not be deleted.");
    }
  }

  async function removeProgressionStep(saved, stepIndex) {
    const steps = Array.isArray(saved.progression) ? saved.progression : [];
    if (steps.length <= 1) {
      setUpdateError("A saved progression must contain at least one chord.");
      return;
    }

    const stepName = steps[stepIndex]?.chord_name || "this chord";
    if (!window.confirm(`Remove ${stepName} from this saved progression?`)) return;

    setUpdateError(null);
    try {
      const updatedSteps = steps.filter((_, index) => index !== stepIndex);
      const result = await updateSavedProgression(saved.id, updatedSteps);
      setProgressions(items => replaceSavedProgression(items, result.progression));
    } catch (error) {
      setUpdateError(error.message || "The saved progression could not be updated.");
    }
  }

  const items = activeTab === "voicings" ? voicings : progressions;

  return (
    <section className="vl-panel vl-library">
      <div className="vl-library-head">
        <div>
          <div className="vl-eyebrow">Your collection</div>
          <h2 className="vl-library-title">Saved Library</h2>
        </div>
        <div className="vl-library-actions">
          {open && (
            <button className="vl-row-apply" type="button" onClick={loadLibrary} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </button>
          )}
          <button
            className="vl-btn"
            type="button"
            onClick={() => setOpen(value => !value)}
            aria-expanded={open}
          >
            {open ? "Close Library" : "Open Library"}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="vl-library-tabs" role="tablist" aria-label="Saved library">
            <button
              className={"vl-mode-btn" + (activeTab === "voicings" ? " active" : "")}
              type="button"
              role="tab"
              aria-selected={activeTab === "voicings"}
              onClick={() => setActiveTab("voicings")}
            >
              Saved Voicings
            </button>
            <button
              className={"vl-mode-btn" + (activeTab === "progressions" ? " active" : "")}
              type="button"
              role="tab"
              aria-selected={activeTab === "progressions"}
              onClick={() => setActiveTab("progressions")}
            >
              Saved Progressions
            </button>
          </div>

          {loadError && <div className="vl-error" role="alert">Could not load saved items: {loadError}</div>}
          {updateError && <div className="vl-error" role="alert">{updateError}</div>}
          {loading && <div className="vl-library-state" role="status">Loading saved harmonies…</div>}
          {!loading && !loadError && items.length === 0 && (
            <div className="vl-library-state">
              {activeTab === "voicings"
                ? "No saved voicings yet. Save one you love and it will appear here."
                : "No saved progressions yet. Build and save a trail to see it here."}
            </div>
          )}

          {!loading && !loadError && activeTab === "voicings" && voicings.length > 0 && (
            <div className="vl-library-grid">
              {voicings.map(voicing => (
                <article className="vl-library-card vl-library-record" key={voicing.id}>
                  <button
                    className="vl-library-record-delete"
                    type="button"
                    onClick={() => deleteVoicing(voicing)}
                    aria-label={`Delete saved ${voicing.chord_name || "custom"} voicing`}
                    title="Delete saved voicing"
                  >
                    ×
                  </button>
                  <div className="vl-library-card-head">
                    <strong>{voicing.chord_name || "Custom voicing"}</strong>
                    {savedDate(voicing.created_at) && <time>{savedDate(voicing.created_at)}</time>}
                  </div>
                  <div className="vl-library-notes">
                    {formatOrderedNotes(voicing.notes) || "Notes unavailable"}
                  </div>
                  <div className="vl-library-meta">{voicing.emotion || "Uncategorized"}</div>
                  <div className="vl-library-card-actions">
                    <button
                      className="vl-row-apply"
                      type="button"
                      onClick={() => playVoicing(voicing)}
                      disabled={playingVoicingId !== null}
                      aria-label={`Play ${voicing.chord_name || "custom"} voicing`}
                    >
                      {playingVoicingId === voicing.id ? "Playing…" : "▶ Play"}
                    </button>
                    <button className="vl-row-apply" type="button" onClick={() => onRestoreVoicing(voicing)}>
                      Restore
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !loadError && activeTab === "progressions" && progressions.length > 0 && (
            <div className="vl-library-grid">
              {progressions.map(saved => {
                const steps = Array.isArray(saved.progression) ? saved.progression : [];
                const displaySteps = savedProgressionDisplaySteps(steps);
                return (
                  <article className="vl-library-card vl-library-record vl-progression-card" key={saved.id}>
                    <button
                      className="vl-library-record-delete"
                      type="button"
                      onClick={() => deleteProgression(saved)}
                      aria-label={`Delete saved progression ${saved.title || "Untitled Progression"}`}
                      title="Delete saved progression"
                    >
                      ×
                    </button>
                    <div className="vl-progression-card-heading">
                      {editingProgressionId === saved.id ? (
                        <input
                          ref={renameInputRef}
                          className="vl-input vl-progression-rename"
                          value={titleDraft}
                          onChange={event => setTitleDraft(event.target.value)}
                          onKeyDown={event => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              skipRenameBlurRef.current = true;
                              saveRename(saved);
                            } else if (event.key === "Escape") {
                              skipRenameBlurRef.current = true;
                              setEditingProgressionId(null);
                              setTitleDraft(saved.title || "Untitled Progression");
                            }
                          }}
                          onBlur={() => {
                            if (skipRenameBlurRef.current) {
                              skipRenameBlurRef.current = false;
                              return;
                            }
                            saveRename(saved);
                          }}
                          aria-label="Rename progression"
                        />
                      ) : (
                        <strong
                          className="vl-progression-editable-title"
                          onDoubleClick={() => beginRename(saved)}
                          title="Double-click to rename progression"
                          aria-label={`${saved.title || "Untitled Progression"}. Double-click to rename`}
                        >
                          {saved.title || "Untitled Progression"}
                        </strong>
                      )}
                      <div className="vl-progression-rename-hint">Double-click title to rename</div>
                      <div className="vl-library-meta">{steps.length} {steps.length === 1 ? "chord" : "chords"}</div>
                      {savedDate(saved.created_at) && <time>{savedDate(saved.created_at)}</time>}
                    </div>
                    <div className="vl-saved-progression-trail">
                      {displaySteps.map((step, index) => (
                        <React.Fragment key={step.order}>
                          <div className="vl-saved-progression-node">
                            <button
                              className="vl-saved-progression-remove"
                              type="button"
                              onClick={() => removeProgressionStep(saved, index)}
                              aria-label={`Remove ${step.chordName} from progression`}
                              title={`Remove ${step.chordName}`}
                            >
                              ×
                            </button>
                            <div className="vl-progression-step-name">{step.chordName}</div>
                            <div className="vl-progression-step-notes">{step.notes}</div>
                          </div>
                          {index < displaySteps.length - 1 && (
                            <span className="vl-saved-progression-arrow" aria-hidden="true">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="vl-library-card-actions">
                      <button
                        className="vl-row-apply"
                        type="button"
                        onClick={() => playProgression(saved)}
                        disabled={playingProgressionId !== null}
                        aria-label={`Play progression ${saved.title || "Untitled Progression"}`}
                      >
                        {playingProgressionId === saved.id ? "Playing…" : "▶ Play Progression"}
                      </button>
                      <button className="vl-row-apply" type="button" onClick={() => onRestoreProgression(saved)}>
                        Restore Progression
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
