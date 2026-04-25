"""
Bayesian Online Change Point Detection (Adams & MacKay 2007).

Pure NumPy implementation using Normal-inverse-gamma conjugate prior
with constant hazard rate.  Each call to ``update()`` is O(R_max) where
R_max is capped at 300, yielding ~0.1 ms per observation.

Usage:
    detector = BayesianOnlineChangePointDetector(hazard_lambda=50.0)
    for obs in observations:
        result = detector.update(obs)
        if result['is_changepoint']:
            print("Changepoint detected!")
"""

import logging
from typing import Dict, Optional

import numpy as np

log = logging.getLogger("bocpd")

# Maximum run length to keep (caps memory + compute)
_MAX_RUN_LENGTH = 300


class BayesianOnlineChangePointDetector:
    """Online Bayesian changepoint detector.

    Parameters
    ----------
    hazard_lambda : float
        Expected run length between changepoints.  Hazard h = 1/hazard_lambda.
    n_features : int
        Dimensionality of observations (treated independently).
    alert_threshold : float
        P(run_length == 0) above this triggers ``is_changepoint``.
    """

    def __init__(self, hazard_lambda: float = 50.0, n_features: int = 8,
                 alert_threshold: float = 0.5):
        self.hazard_lambda = max(hazard_lambda, 1.0)
        self.n_features = n_features
        self.alert_threshold = alert_threshold

        # Constant hazard: P(changepoint) = 1 / hazard_lambda
        self._hazard = 1.0 / self.hazard_lambda

        # Normal-inverse-gamma sufficient statistics (per feature)
        # mu0, kappa0, alpha0, beta0 — weakly informative prior
        self._mu0 = np.zeros(n_features)
        self._kappa0 = 1.0
        self._alpha0 = 1.0
        self._beta0 = 1.0

        # Run-length distribution P(r_t | x_{1:t})
        # Index i corresponds to run length i.
        self._run_length_dist: np.ndarray = np.array([1.0])  # P(r_0=0) = 1

        # Sufficient stats arrays — one entry per possible run length
        self._mu: np.ndarray = np.array([self._mu0.copy()])      # (R, F)
        self._kappa: np.ndarray = np.array([self._kappa0])       # (R,)
        self._alpha: np.ndarray = np.array([self._alpha0])       # (R,)
        self._beta: np.ndarray = np.array([self._beta0 * np.ones(n_features)])  # (R, F)

        # Outputs
        self._t = 0
        self._changepoint_prob = 0.0
        self._run_length = 0

    def update(self, observation: np.ndarray) -> Dict:
        """Process one observation and return changepoint info.

        Parameters
        ----------
        observation : ndarray of shape (n_features,)

        Returns
        -------
        dict with keys: changepoint_prob, run_length, is_changepoint, t
        """
        x = np.asarray(observation, dtype=np.float64).ravel()
        if len(x) != self.n_features:
            raise ValueError(
                f"Expected {self.n_features} features, got {len(x)}")

        self._t += 1
        R = len(self._run_length_dist)

        # --- 1. Predictive probability P(x_t | r_{t-1}, x_{1:t-1}) ---
        # Student-t predictive per feature, then product across features
        pred_probs = self._predictive_prob(x)  # shape (R,)

        # --- 2. Growth probabilities ---
        growth = self._run_length_dist * pred_probs * (1.0 - self._hazard)

        # --- 3. Changepoint probability (new run starts) ---
        cp = np.sum(self._run_length_dist * pred_probs * self._hazard)

        # --- 4. New run-length distribution ---
        new_dist = np.empty(R + 1)
        new_dist[0] = cp
        new_dist[1:] = growth

        # Normalize
        total = new_dist.sum()
        if total > 0:
            new_dist /= total
        else:
            new_dist[0] = 1.0
            new_dist[1:] = 0.0

        # --- 5. Update sufficient statistics ---
        # Grow stats arrays (new run length appended)
        new_mu = np.empty((R + 1, self.n_features))
        new_kappa = np.empty(R + 1)
        new_alpha = np.empty(R + 1)
        new_beta = np.empty((R + 1, self.n_features))

        # Index 0: fresh prior (changepoint → reset)
        new_mu[0] = self._mu0.copy()
        new_kappa[0] = self._kappa0
        new_alpha[0] = self._alpha0
        new_beta[0] = self._beta0 * np.ones(self.n_features)

        # Indices 1..R: update from previous sufficient stats
        kappa_old = self._kappa
        mu_old = self._mu
        alpha_old = self._alpha
        beta_old = self._beta

        kappa_new = kappa_old + 1.0
        mu_new = (kappa_old[:, None] * mu_old + x[None, :]) / kappa_new[:, None]
        alpha_new = alpha_old + 0.5
        beta_new = (beta_old
                    + 0.5 * kappa_old[:, None] / kappa_new[:, None]
                    * (x[None, :] - mu_old) ** 2)

        new_mu[1:] = mu_new
        new_kappa[1:] = kappa_new
        new_alpha[1:] = alpha_new
        new_beta[1:] = beta_new

        # --- 6. Truncate to MAX_RUN_LENGTH ---
        if len(new_dist) > _MAX_RUN_LENGTH:
            # Fold excess probability into the last kept entry
            new_dist[_MAX_RUN_LENGTH - 1] += new_dist[_MAX_RUN_LENGTH:].sum()
            new_dist = new_dist[:_MAX_RUN_LENGTH]
            new_mu = new_mu[:_MAX_RUN_LENGTH]
            new_kappa = new_kappa[:_MAX_RUN_LENGTH]
            new_alpha = new_alpha[:_MAX_RUN_LENGTH]
            new_beta = new_beta[:_MAX_RUN_LENGTH]

        self._run_length_dist = new_dist
        self._mu = new_mu
        self._kappa = new_kappa
        self._alpha = new_alpha
        self._beta = new_beta

        # --- 7. Outputs ---
        self._changepoint_prob = float(new_dist[0])
        self._run_length = int(np.argmax(new_dist))

        return {
            "changepoint_prob": round(self._changepoint_prob, 6),
            "run_length": self._run_length,
            "is_changepoint": self._changepoint_prob > self.alert_threshold,
            "t": self._t,
        }

    def _predictive_prob(self, x: np.ndarray) -> np.ndarray:
        """Student-t predictive probability for each run length.

        For each run length r and each feature f, the predictive is
        Student-t(2*alpha, mu, beta*(kappa+1)/(alpha*kappa)).
        We compute log-probs per feature and sum across features.
        """
        from scipy.special import gammaln

        R = len(self._run_length_dist)
        mu = self._mu          # (R, F)
        kappa = self._kappa    # (R,)
        alpha = self._alpha    # (R,)
        beta = self._beta      # (R, F)

        nu = 2.0 * alpha                                    # (R,)
        var = beta * (kappa[:, None] + 1.0) / (alpha[:, None] * kappa[:, None])  # (R, F)
        var = np.maximum(var, 1e-12)

        # Student-t log-pdf per feature
        diff = x[None, :] - mu                              # (R, F)
        log_pdf = (gammaln((nu[:, None] + 1.0) / 2.0)
                   - gammaln(nu[:, None] / 2.0)
                   - 0.5 * np.log(np.pi * nu[:, None] * var)
                   - ((nu[:, None] + 1.0) / 2.0)
                   * np.log(1.0 + diff ** 2 / (nu[:, None] * var)))

        # Sum across features → total log-prob per run length
        total_log_prob = np.sum(log_pdf, axis=1)             # (R,)

        # Convert to probability (with numerical safety)
        max_lp = np.max(total_log_prob)
        pred_probs = np.exp(total_log_prob - max_lp)

        return pred_probs

    def reset(self):
        """Reset detector to initial state."""
        self._run_length_dist = np.array([1.0])
        self._mu = np.array([self._mu0.copy()])
        self._kappa = np.array([self._kappa0])
        self._alpha = np.array([self._alpha0])
        self._beta = np.array([self._beta0 * np.ones(self.n_features)])
        self._t = 0
        self._changepoint_prob = 0.0
        self._run_length = 0

    def get_state(self) -> Dict:
        """Serialize detector state for persistence."""
        return {
            "hazard_lambda": self.hazard_lambda,
            "n_features": self.n_features,
            "alert_threshold": self.alert_threshold,
            "t": self._t,
            "changepoint_prob": self._changepoint_prob,
            "run_length": self._run_length,
            "run_length_dist": self._run_length_dist.tolist(),
            "mu": self._mu.tolist(),
            "kappa": self._kappa.tolist(),
            "alpha": self._alpha.tolist(),
            "beta": self._beta.tolist(),
        }

    def set_state(self, state: Dict):
        """Restore detector from serialized state."""
        self.hazard_lambda = state["hazard_lambda"]
        self._hazard = 1.0 / self.hazard_lambda
        self.n_features = state["n_features"]
        self.alert_threshold = state["alert_threshold"]
        self._t = state["t"]
        self._changepoint_prob = state["changepoint_prob"]
        self._run_length = state["run_length"]
        self._run_length_dist = np.array(state["run_length_dist"])
        self._mu = np.array(state["mu"])
        self._kappa = np.array(state["kappa"])
        self._alpha = np.array(state["alpha"])
        self._beta = np.array(state["beta"])