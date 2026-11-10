---
title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness"
paper_url: "https://arxiv.org/abs/2205.14135"
thumbnail: "/assets/flash-attention/first-page.png"
description: ""
date: "2026-11-05"
shelf_order: 1
published: true
math: true
last_modified_at: "2026-11-10"
---

FlashAttention is IO-aware self-attention that accounts for the cost of reading/writing data and uses GPU tiling to make it more efficient.

The motivation is that equipping transformer models with longer context remains difficult since standard self-attention has time/memory complexity that is quadratic in sequence length. In the past, there have been attempts to approximate attention with sparse approximation, low-rank approximation, and a combination of the two.

Sparse attention is when each token attends to a subset of tokens. Low-rank attention approximates the attention matrix by using smaller matrices. However, even though both of these methods reduce the compute requirements, they focus on FLOP reduction, which tends to ignore overhead from IO.

Ergo, since standard attention can be memory-bound while these approximate methods focus on reducing computation, can we improve its memory-access complexity?

On-chip SRAM is super fast but very small, so it is used for blocks that are currently being computed on. HBM is much larger but also slower, so it stores the full $$Q$$, $$K$$, and $$V$$ matrices along with the output. Recall that:

$$
\operatorname{Attention}(Q, K, V)
= \operatorname{softmax}\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V.
$$
{: .math-display}

Kernel fusion is used to accelerate memory-bound operations, but since model training often requires intermediate values to be written to HBM for the backward pass, its effectiveness can be reduced.

**Standard Attention Implementation**

1. Loads $$Q$$ and $$K$$ from HBM, computes $$S = QK^{\top}/\sqrt{d_k}$$, and writes $$S$$ to HBM.
2. Reads $$S$$ from HBM, computes $$P = \operatorname{softmax}(S)$$, and writes $$P$$ to HBM.
3. Loads $$P$$ and $$V$$ from HBM, computes $$O = PV$$, and writes $$O$$ to HBM.
4. Returns $$O$$.

Avoiding reading/writing the attention matrix from/to HBM requires:

1. Computing the softmax reduction without holding the whole input in SRAM at once.
2. Not storing the entire $$N \times N$$ attention matrix for the backward pass.

These challenges are addressed by tiling and recomputation:

**Tiling** splits the inputs $$Q$$, $$K$$, and $$V$$ into blocks and loads them from slow HBM to fast SRAM. It uses each score block to update the output before discarding it. For normalization, FlashAttention keeps track of a running maximum and normalization sum for each query, updating them and rescaling earlier contributions as new blocks arrive.

**Recomputation** allows us to avoid storing $$O(N^2)$$ intermediate values and instead save the output $$O$$ and softmax statistics $$(m, \ell)$$ for the backward pass. By loading blocks of $$Q$$, $$K$$, and $$V$$ into SRAM, we can recompute blocks of the score matrix $$S$$ and attention probabilities $$P$$ as needed. This adds computation but reduces memory accesses.

Theoretically, no other exact attention algorithm can asymptotically improve on FlashAttention’s HBM-access complexity across every SRAM size in the analyzed range, as every exact algo must at least read its inputs and write its output. When the SRAM is large enough, FlashAttention’s memory traffic already matches that minimum up to constant factors.

FlashAttention enables faster model training, better models through longer-context training, and improved performance on attention benchmarks in its evaluated settings.

FlashAttention computes exact dense attention, while block-sparse FlashAttention is reported to be 2–4× faster than dense FlashAttention by using approximation in the paper’s evaluated settings.

**Limitations:**

1. Each new attention variant needs a handwritten CUDA kernel along with specific tuning across GPU architectures.
2. A similar transformation can be applied to layers other than attention that move data to/from HBM.
3. Splitting attention across GPUs requires minimizing data transfers between GPUs.
