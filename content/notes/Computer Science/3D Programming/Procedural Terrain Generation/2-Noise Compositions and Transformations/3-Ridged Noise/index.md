---
status: "draft"
date: "2026-08-01"
summary: "Create crest-like terrain features by folding a base field around zero and inverting the result into ridged noise."
---

# Ridged Noise

Ridged noise starts with the same fold used by billow noise, then inverts it:

$$
R(\mathbf{p}) = 1 - \lvert N(\mathbf{p}) \rvert
$$

Values near a base-noise zero crossing become high, while values near positive or negative extremes become low. This turns the smooth transition lines of the base field into visible crests.

## Sharpening the crest

The basic ridge can be made more selective with an exponent:

$$
R_\gamma(\mathbf{p}) = \left(1 - \lvert N(\mathbf{p}) \rvert\right)^\gamma
$$

For $\gamma > 1$, broad high areas shrink toward narrow ridgelines. This is useful for mountain masks, but it also reduces the amount of terrain that remains high, so it is commonly blended with a broader elevation field.

A more elaborate **ridged multifractal** adds feedback between octaves. This article begins with the simpler independent-octave version; it makes the fold-and-invert operation visible before introducing that extra coupling.

## Interactive field explorer

Compare ridged mode with billow using the same seed. Their geometry comes from the same primitive; one favors rounded lobes, and the other favors the lines between them.

<iframe src="../../simulations/noise-field-explorer.html?mode=ridged" width="100%" height="740px"></iframe>

> [!TIP]
> Use a ridged field as a *mountain influence* rather than mapping it directly to all elevation. It gives you control over where sharp terrain appears without making every part of a world mountainous.
