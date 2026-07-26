import React, { useEffect, useRef, useState } from "react";
import {
  deleteSavedProgression,
  deleteSavedVoicing,
  getSavedProgressions,
  getSavedVoicings,
  updateProgression,
  updateSavedProgression,
  updateVoicing,
} from "../services/api.js";
import { formatOrderedNotes } from "../noteParsing.js";
import {
  replaceSavedProgression,
  savedProgressionDisplaySteps,
  normalizeProgressionTitle,
} from "../savedProgressionDisplay.js";
import {
  visibleProgressions,
  visibleVoicings,
  voicingCategories,
} from "../savedLibraryFilters.js";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lengthFilter, setLengthFilter] = useState("all");
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

  async function toggleVoicingFavorite(saved) {
    setUpdateError(null);
    try {
      const result = await updateVoicing(saved.id, { favorite: !saved.favorite });
      setVoicings(items => replaceSavedProgression(items, result.voicing));
    } catch (error) {
      setUpdateError(error.message || "The favorite could not be updated.");
    }
  }

  async function toggleProgressionFavorite(saved) {
    setUpdateError(null);
    try {
      const result = await updateProgression(saved.id, { favorite: !saved.favorite });
      setProgressions(items => replaceSavedProgression(items, result.progression));
    } catch (error) {
      setUpdateError(error.message || "The favorite could not be updated.");
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

  const filteredVoicings = visibleVoicings(voicings, {
    query: searchQuery,
    sort: sortOrder,
    favoritesOnly,
    category: categoryFilter,
  });
  const filteredProgressions = visibleProgressions(progressions, {
    query: searchQuery,
    sort: sortOrder,
    favoritesOnly,
    length: lengthFilter,
  });
  const items = activeTab === "voicings" ? filteredVoicings : filteredProgressions;
  const hasActiveFilters = Boolean(searchQuery.trim()) || favoritesOnly ||
    (activeTab === "voicings" ? categoryFilter !== "all" : lengthFilter !== "all");

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

          <div className="vl-library-controls">
            <div className="vl-library-search">
              <input
                className="vl-input"
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search saved library…"
                aria-label="Search saved library"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">
                  ×
                </button>
              )}
            </div>
            <select
              className="vl-select"
              value={sortOrder}
              onChange={event => setSortOrder(event.target.value)}
              aria-label="Sort saved library"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">Title A–Z</option>
              <option value="za">Title Z–A</option>
            </select>
            <select
              className="vl-select"
              value={favoritesOnly ? "favorites" : "all"}
              onChange={event => setFavoritesOnly(event.target.value === "favorites")}
              aria-label="Filter favorites"
            >
              <option value="all">All</option>
              <option value="favorites">Favorites</option>
            </select>
            {activeTab === "voicings" ? (
              <select
                className="vl-select"
                value={categoryFilter}
                onChange={event => setCategoryFilter(event.target.value)}
                aria-label="Filter voicing category"
              >
                <option value="all">All categories</option>
                {voicingCategories(voicings).map(category => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
            ) : (
              <select
                className="vl-select"
                value={lengthFilter}
                onChange={event => setLengthFilter(event.target.value)}
                aria-label="Filter progression length"
              >
                <option value="all">All lengths</option>
                <option value="1-2">1–2 chords</option>
                <option value="3-4">3–4 chords</option>
                <option value="5+">5+ chords</option>
              </select>
            )}
          </div>

          {loadError && <div className="vl-error" role="alert">Could not load saved items: {loadError}</div>}
          {updateError && <div className="vl-error" role="alert">{updateError}</div>}
          {loading && <div className="vl-library-state" role="status">Loading saved harmonies…</div>}
          {!loading && !loadError && items.length === 0 && (
            <div className="vl-library-state">
              {hasActiveFilters
                ? "No saved items match your search or filters."
                : activeTab === "voicings"
                ? "No saved voicings yet. Save one you love and it will appear here."
                : "No saved progressions yet. Build and save a trail to see it here."}
            </div>
          )}

          {!loading && !loadError && activeTab === "voicings" && filteredVoicings.length > 0 && (
            <div className="vl-library-grid">
              {filteredVoicings.map(voicing => (
                <article className="vl-library-card vl-library-record" key={voicing.id}>
                  <button
                    className={"vl-library-favorite" + (voicing.favorite ? " active" : "")}
                    type="button"
                    onClick={() => toggleVoicingFavorite(voicing)}
                    aria-label={`${voicing.favorite ? "Remove" : "Add"} ${voicing.chord_name || "custom voicing"} ${voicing.favorite ? "from" : "to"} favorites`}
                    title={voicing.favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {voicing.favorite ? "★" : "☆"}
                  </button>
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

          {!loading && !loadError && activeTab === "progressions" && filteredProgressions.length > 0 && (
            <div className="vl-library-grid">
              {filteredProgressions.map(saved => {
                const steps = Array.isArray(saved.progression) ? saved.progression : [];
                const displaySteps = savedProgressionDisplaySteps(steps);
                return (
                  <article className="vl-library-card vl-library-record vl-progression-card" key={saved.id}>
                    <button
                      className={"vl-library-favorite" + (saved.favorite ? " active" : "")}
                      type="button"
                      onClick={() => toggleProgressionFavorite(saved)}
                      aria-label={`${saved.favorite ? "Remove" : "Add"} ${saved.title || "Untitled Progression"} ${saved.favorite ? "from" : "to"} favorites`}
                      title={saved.favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      {saved.favorite ? "★" : "☆"}
                    </button>
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
