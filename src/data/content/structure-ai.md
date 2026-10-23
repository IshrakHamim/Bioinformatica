The lecture notes said "the 3D shape, and thus the function, of a protein is determined by its sequence." For 50 years, predicting that shape from the sequence was one of biology's grand challenges. Between 2020 and 2024 it was largely solved for single protein chains, and the work earned the **2024 Nobel Prize in Chemistry**. This lesson explains how, what it means for research, and what remains open. It builds on the protein basics from the Introduction, multiple sequence alignment, and neural networks.

{{ref:intro#proteins-sequence-structure-function}}

Start with the story: this documentary follows the AlphaFold team through the competition that changed the field.

{{video:gg7WjuFs8F4}}

## The protein folding problem and CASP

**Why prediction is needed.** Experimental structure determination (X-ray crystallography, NMR, cryo-electron microscopy) can take months to years per protein, and some proteins resist it entirely. The **Protein Data Bank (PDB)** holds about 200,000+ experimental structures, while sequencing has produced **hundreds of millions** of protein sequences. Prediction closes that gap.

**Why it's hard.** A chain of a few hundred amino acids could in principle fold in an astronomically large number of ways, yet the real protein reliably folds into one shape. Simulating the physics directly is far too slow for most proteins.

**CASP** (Critical Assessment of protein Structure Prediction), held every two years since 1994, is a **blind** competition: predictors receive the sequences of proteins whose structures have been solved but not yet released, and are scored when the structures come out. Accuracy is measured by **GDT** (0–100; roughly, the percentage of residues placed within a distance threshold of their true position). Above about 90 is considered competitive with experiment.

Before deep learning, the best methods combined physics- or statistics-based energy functions with assembling fragments from known structures (Rosetta), and copied from **templates**, known structures of similar sequences.

**The key biological signal: co-evolution.** If residues i and j touch in the folded protein, a mutation at i that disturbs the contact is often compensated by a mutation at j. Across a protein family, columns i and j of the **multiple sequence alignment** therefore change together. Detecting such correlated columns predicts which residues are in **contact**, and enough contacts pin down the fold. That is why MSAs are central to structure prediction.

{{ref:alignment#multiple-sequence-alignment}}

## AlphaFold 2: how it works

**CASP14 (2020).** AlphaFold 2 reached a median GDT of about 92 across targets, comparable to experimental accuracy for many proteins. The method was published by Jumper et al. in *Nature* (2021), with open-source code.

**The pipeline:**
1. **Inputs:** the target sequence, an **MSA** of related sequences found by searching large sequence databases, and (optionally) structural **templates**.
2. **Evoformer** (48 blocks): a **transformer** (a neural network built on *attention*, which lets every element of the input look at every other) that jointly updates two representations: an **MSA representation** (sequences × residues) and a **pair representation** (residue × residue, a learned version of "how do residues i and j relate?"). Information flows back and forth between them. "**Triangle**" updates enforce geometric consistency: if i is near j and j is near k, that constrains the distance from i to k.
3. **Structure module:** turns the representations into 3D coordinates. Each residue is treated as a rigid body (a "frame") that is rotated and moved by **invariant point attention**, so the result doesn't depend on how the whole protein is oriented in space; then side chains are added.
4. **Recycling:** the output is fed back through the network a few times to refine it.
5. **Confidence outputs:** **pLDDT** (per-residue confidence, 0–100) and **PAE** (predicted aligned error between pairs of residues, which tells you whether the relative position of two domains is trustworthy).

{{ref:neural#neural-networks}}

## AlphaFold DB: 200 million structures

In 2021, DeepMind and **EMBL-EBI** launched the AlphaFold Protein Structure Database. In **2022** it expanded to **over 200 million** predicted structures, covering nearly every protein in UniProt. Researchers now start most protein projects by looking up the predicted structure.

Explore it live. Pick a protein and look at the colours, which show pLDDT:

{{widget:alphafold}}

**Reading pLDDT:**
- **> 90** very high: the backbone and usually the side chains are right.
- **70–90** confident: the backbone is generally right.
- **50–70** low: treat with caution.
- **< 50** very low. These regions are often **intrinsically disordered**: they have no single fixed shape in reality. So very low pLDDT is often a genuine biological signal, not just a failure.

Always look at PAE as well before trusting the arrangement of separate domains.

{{ref:tools#databases-you-will-use|tools#file-formats}}

This medical journal's short explainer covers what AlphaFold means for medicine and drug discovery:

{{video:7q8Uw3rmXyE}}

## AlphaFold 3, RoseTTAFold and language-model folding

- **AlphaFold 3** (Abramson et al., *Nature* 2024) predicts **joint structures of complexes** containing proteins, **DNA, RNA, small-molecule ligands, ions** and modified residues. It replaces the Evoformer with a lighter **Pairformer** and the structure module with a **diffusion module** that generates atom coordinates directly. (A diffusion model learns to remove noise: it starts from random atom positions and denoises them step by step into a structure, the same way image diffusion models turn noise into pictures.) It reported large gains for protein–ligand interactions over docking tools. It is available through the AlphaFold Server, with code and weights released for academic use in November 2024.
- **RoseTTAFold** (Baek et al., *Science* 2021, Baker lab): a "three-track" network that reasons over sequence, residue–residue distances and 3D coordinates together. Its all-atom successor handles complexes with nucleic acids and small molecules.
- **ESMFold** (Lin et al., *Science* 2023, Meta): uses the **ESM-2 protein language model** (up to 15 billion parameters, trained only on sequences) and predicts structure from a **single sequence**, with no MSA, and much faster than AlphaFold 2. It was used to predict about 600 million metagenomic proteins (the ESM Metagenomic Atlas).
- **ESM3** (Hayes et al., *Science* 2025, EvolutionaryScale): a multimodal generative model over sequence, structure and function. It generated **esmGFP**, a bright fluorescent protein with only 58% identity to known fluorescent proteins.

**How can a language model fold proteins without an MSA?** A protein language model is trained to predict masked amino acids from their context, over hundreds of millions of sequences. To do that well it has to learn which positions co-vary, which is the same co-evolution signal an MSA provides, but stored in the model's weights. This video explains ESM-2's architecture and training:

{{video:_9oTqDWGaFc}}

For a deep but accessible 25-minute explanation of the whole story, from the folding problem to AlphaFold's impact, this is the best single video:

{{video:P_fHJIYENdI}}

## Protein design and the 2024 Nobel Prize

Prediction asks: sequence → structure. **Design** asks the inverse: what sequence will fold into a structure with a function we want, such as binding a virus, or catalysing a reaction no natural enzyme performs?

David Baker explains in this talk what designed proteins could do:

{{video:PJLT0cAPNfs}}

- **RFdiffusion** (Watson et al., *Nature* 2023): a diffusion model that generates **new protein backbones** (binders, symmetric assemblies, enzyme scaffolds) by denoising random coordinates, guided toward the desired shape or binding target. A cryo-EM structure of one designed binder bound to influenza haemagglutinin closely matched the design.
- **ProteinMPNN** (Dauparas et al., *Science* 2022): designs sequences that will fold into a given backbone (the "inverse folding" problem).
- **The typical design loop:** RFdiffusion generates a backbone → ProteinMPNN designs sequences for it → AlphaFold checks whether each sequence is predicted to fold that way → the best candidates are made and tested in the lab.

This technical seminar explains how RFdiffusion works:

{{video:wIHwHDt2NoI}}

**Nobel Prize in Chemistry 2024:** one half to **David Baker** (University of Washington) "for computational protein design"; the other half jointly to **Demis Hassabis** and **John Jumper** (Google DeepMind) "for protein structure prediction."

## From structure to variants: AlphaMissense

A **missense variant** changes one amino acid. Most are harmless; some disrupt the protein and cause disease. For most possible variants, nobody has measured the effect.

**AlphaMissense** (Cheng et al., *Science* 2023) adapts AlphaFold to score missense variants, combining structural context with evolutionary information (how tolerated is each amino acid at each position across related proteins?). It classified all **71 million** possible human missense variants, labelling 89% as likely benign or likely pathogenic, versus 0.1% that had been confirmed by human experts. It is used to **prioritize** variants in rare-disease diagnostics, alongside clinical evidence and never instead of it.

## Limitations researchers must know

- Predictions are mostly a **single static structure**. Proteins are dynamic: multiple conformations, allostery (shape changes on binding) and folding pathways are not captured.
- **Disordered regions**, rare **orphan proteins** with few relatives (shallow MSAs), and **antibody–antigen** interfaces remain hard.
- AlphaFold is not reliable for predicting the **effect of a point mutation on stability** directly; use dedicated models.
- Complex predictions (AlphaFold 3) can **hallucinate** plausible-looking structure in low-confidence regions, so always check PAE and pLDDT.
- High confidence ≠ biological truth in a specific context (ligands, membranes, post-translational modifications).

:::sota Research directions (2025–26)
Conformational ensembles and dynamics; protein–ligand co-folding for drug discovery; generative design of enzymes and binders (including de novo antibodies); protein language models for function prediction; integrating structure into variant interpretation.
:::
