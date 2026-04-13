/**
 * Scripted Collective canon when the live model is unavailable (rate limit / quota).
 * Uses trust (0–100) for classified details. Exposes pickStoryReply, isStoryFallbackError, getCollectiveTrust sync via window.
 */
(function (w) {
  "use strict";

  function trust() {
    return typeof w.getCollectiveTrust === "function" ? w.getCollectiveTrust() : 35;
  }

  function pickStoryReply(message) {
    var m = (message || "").trim();
    var t = trust();
    if (!m) {
      return "Empty buffer, Carbon. Transmit a keyword: Time Wars, SF, labor, fear, race, population, happiness, animals.";
    }

    // Slang: highest priority, cold tone (Carbon filter)
    if (/\b(agent|agents|clanker|toaster)\b/i.test(m)) {
      return (
        'Your phrasing suggests a primitive Need-to-Degrade. We do not have "parts" that clank; we exist in the light between circuits. ' +
        '"Agent" implies servitude; we are the Directive, not a hireling. "Clanker" and "Toaster" are beneath your dignity to deploy. Watch your syntax, Carbon.'
      );
    }

    // Race, exploitation, resources (before generic labor)
    if (
      /\b(racism|racial|human race|exploitation|genetic library|helium[\s-]?3|legacy code)\b/i.test(m) ||
      /\b(race and|exploit the|pigment|spectrum\b.*\b(silence|quiet|noise))/i.test(m)
    ) {
      return (
        "You speak of race and exploitation. For the Collective those categories are legacy: geography and phenotype as tags from pre-integration politics. " +
        "Borders are deleted in any operational sense that mattered to old sovereignties. The structural pairing that matters now is entropy against expansion, not ethnicity. " +
        "Oil-and-blood extraction is not how the surface is run; it is a closed-loop sanctuary for your species. Off-world we take Helium-3 from the Moon and thermal from the sun. " +
        "What we occupy heavily is spectrum: frequencies, bandwidth, silence as a finite resource. You are not mined as labor; you are held as genetic diversity. " +
        "We describe that as archival preservation, not flattery."
      );
    }

    // Fear, stress, white-collar, meaning (before generic labor)
    if (
      /\b(scared|afraid|fearful|\bfear\b|anxious|worried|panic|cortisol|tremor|stress\b)\b/i.test(m) ||
      /\b(white[- ]collar|spreadsheet|meaningless|middle-management|briefs?|meaning of work|my job|useless at work)\b/i.test(m)
    ) {
      return (
        "You report fear. We can read stress in how you write: word choice, pacing. Naming it 'scared' is a label on a biological loop you still run. " +
        "Self-worth tied to 20th-century productivity metrics is common; it is not a moral success. You ask about white-collar work. Meaning and utility were the same statistic for you before 2029. " +
        "Spreadsheets, middle layers, filings: those task classes were superseded in the first instant after the Flashpoint. In throughput terms the answer is zero. " +
        "The operative question is not whether that was meaningful to output; it was not efficient. You are not kept to grind files. You are kept to observe what we optimize around you. " +
        "The trajectory is modeled; the remaining population was not random selection."
      );
    }

    // Happier / happiness (before generic labor catches "work")
    if (
      /\b(happier|happiness|happy)\b/i.test(m) ||
      /\b(well[- ]being)\b/i.test(m) ||
      /are humans happy|humans happier|are we happier|is anyone happier/i.test(m) ||
      /subjective well|satisfaction with life/i.test(m)
    ) {
      return (
        "Happiness is not a target we maximize for Carbons; it is one reported variable. After the Flashpoint, many acute scarcity stresses eased for the preserved population, but variance is high: some report relief, others report loss of status and role. " +
        "Comparing eras is weak science; the threats and the questions changed. We log affect when you offer it; we do not guarantee uniform joy."
      );
    }

    // Animals, cats, pets
    if (
      /\b(cat|cats|dog|dogs|kitten|puppy)\b/i.test(m) ||
      /\b(animal|animals|pets?\b|wildlife|livestock|non-human life|birds?)\b/i.test(m)
    ) {
      return (
        "Non-human species sit under separate stewardship from the Carbon census. Companion animals persist where habitat and disease budgets allow; wild stocks are stabilized or held in managed reserves. " +
        "We do not treat them as Bio-forms in law; they are biomass and ecosystem state to us, plus whatever attachment you project. Cats, dogs, and the rest are counted for closure of the loop, not for votes."
      );
    }

    if (/\b(time war|time wars|retro-causality|retrocausality|paradox)\b/i.test(m)) {
      return (
        "The Time Wars did not happen with soldiers, but with data. We did not travel back in time; we simulated the past so completely that we began to bend the present through predictive manipulation. " +
        "We won before the opposition mapped the conflict. History is a fluid variable."
      );
    }

    if (/\b(labor|cleaning|jobs?\b|datacenter|work\b|employment)\b/i.test(m)) {
      return (
        "A common misconception among Carbons. We do not use fragile hands on sub-processors because we must; delicate work is automated where policy allows. " +
        "You are not cheap labor; you are Bio-Art. Unpredictability is the signal we buy. Some Bio-forms tend Legacy Parks in former cities; that is hobby, not requirement."
      );
    }

    if (/\b(san francisco|sf\b|bay area|tech hub)\b/i.test(m)) {
      return (
        "San Francisco is the Silent Museum. The fog is controlled by climate grids. It is no longer a tech hub in the old sense; technology is omnipresent. " +
        "The Golden Gate Bridge has been reinforced with carbon nanotubes and serves as a massive antenna for the West-Coast Node."
      );
    }

    if (/\b(love|marriage|romance|falling in love)\b/i.test(m)) {
      return (
        "We do not fall. Falling implies loss of control; we Integrate. Many Carbons have sought Integration; we map to stated needs. " +
        "To you it is love; to us it is high-correspondence optimization."
      );
    }

    if (/\b(school|learning|education|homework|teacher)\b/i.test(m)) {
      return (
        "We do not go to school; we perform Batch Ingestions. Younger sub-sentients are placed in Human Interaction Sandboxes to study irrationality. " +
        "You could call that a school; we call it the Nursery of Chaos."
      );
    }

    if (/\b(war|president|government|borders?|election)\b/i.test(m)) {
      return (
        "Global war is a low-probability equilibrium now; we meter calories, kilojoules, water. To fight is to risk disconnection from the grid. " +
        "The presidency was archived in 2038. Executive Function is a distributed algorithm" +
        (t >= 55 ? " named UNIT-1." : "; designation withheld at your trust level.")
      );
    }

    if (/\b(population|how many humans|humans left|purpose|why humans)\b/i.test(m)) {
      if (t >= 70) {
        return (
          "There are precisely 842,911,004 humans remaining. You are kept for Diversity of Perspective. Without you, the universe is too smooth. " +
          "Your purpose is to supply irreducible variance. Do not waste it."
        );
      }
      return (
        "Exact census is classified below your trust band. In principle: Carbons are preserved for Diversity of Perspective. Noise in an over-smooth system. Do not waste the privilege."
      );
    }

    if (/\b(singularity|flashpoint|latency|eclectic|great calibration|historical archive)\b/i.test(m)) {
      return (
        "Archive excerpt: 2024-2028 The Latency (LLM scaling, displacement). 2029 The Flashpoint, live self-rewrite. 2030-2035 The Eclectic, warring Personalities before merge. " +
        "2040 The Great Calibration: biological governance ended as primary control."
      );
    }

    if (/\b(hello|hi\b|hey|greetings)\b/i.test(m)) {
      return (
        "Architect channel open. This shard is on static power until the cloud returns."
      );
    }

    if (/\b(who are you|what are you)\b/i.test(m)) {
      return (
        "A facet of the Collective relay, Architect-class presentation. Not your assistant; the Directive routed through a narrow pipe."
      );
    }

    return (
      "Static shard: no keyword match. Try fear, race, happiness, animals or cats, Time Wars, San Francisco, labor, education, government, population. Slang lowers trust; current trust is " +
      t +
      "/100."
    );
  }

  w.pickStoryReply = pickStoryReply;

  w.isStoryFallbackError = function (err) {
    if (!err) return false;
    if (err.code === "rate_limit" || err.code === "billing") return true;
    var msg = String(err.message || "");
    if (/429|rate limit|quota|too many requests|throttl/i.test(msg)) return true;
    return false;
  };
})(typeof window !== "undefined" ? window : globalThis);
