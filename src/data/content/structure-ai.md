The lecture notes said “the 3D shape, and thus the function, of a protein is determined by its sequence.” For 50 years, predicting that shape was one of biology's grand challenges. Between 2020 and 2024 it was largely solved for single protein chains, and the work earned the **2024 Nobel Prize in Chemistry**. This module explains how, what it means, and what remains open.

## The protein folding problem and CASP

- Experimental structures (X-ray crystallography, NMR, cryo-EM) can take months to years per protein. The **PDB** holds ~200,000+ structures, versus hundreds of millions of known sequences.
- **CASP** (Critical Assessment of protein Structure Prediction), held every two years since 1994, is a blind competition: predictors receive sequences of soon-to-be-released structures. Accuracy is measured by **GDT** (0–100; roughly, the percentage of residues placed within distance thresholds of the true position).
- Before deep learning, methods combined physics/knowledge-based energy functions with fragment assembly (Rosetta) and templates from homologs.

**The key biological signal, co-evolution:** if residues i and j touch in 3D, a mutation at i is often compensated by a mutation at j. In a **multiple sequence alignment** of a protein family, columns i and j then co-vary. Detecting such correlations predicts **contacts**, and contacts constrain the fold. MSAs (Module 10) are therefore central.

## AlphaFold 2: how it works

**CASP14 (2020):** AlphaFold 2 reached a median GDT of ~92 across targets, comparable to experimental accuracy for many proteins. The paper is Jumper et al., *Nature* 2021, with open-source code.

**Pipeline:**
1. **Inputs:** the target sequence, an **MSA** of related sequences found in large databases, and (optionally) structural **templates**.
2. **Evoformer** (48 blocks): a transformer that jointly updates an **MSA representation** (sequences × residues) and a **pair representation** (residue × residue). Information flows between them, and “**triangle**” updates enforce geometric consistency (if i is near j and j is near k, that constrains i–k).
3. **Structure module:** turns the representations into 3D coordinates, treating each residue as a rigid body (a “frame”) moved by **invariant point attention**, then adds side chains.
4. **Recycling:** the output is fed back in a few times to refine it.
5. **Confidence outputs:** **pLDDT** (per-residue, 0–100) and **PAE** (predicted aligned error between pairs of residues, which tells you whether two domains' relative position is trustworthy).

{{yt:gg7WjuFs8F4|AlphaFold: The making of a scientific breakthrough (Google DeepMind)}}

## AlphaFold DB: 200 million structures

In 2021, DeepMind and **EMBL-EBI** launched the AlphaFold Protein Structure Database; in **2022** it expanded to **over 200 million** predicted structures, covering nearly every protein in UniProt. Researchers now start most projects by looking up the predicted structure. Explore it live (colours = pLDDT):

{{widget:alphafold}}

**Reading pLDDT:** > 90 very high (side chains usually right); 70–90 confident backbone; 50–70 low; < 50 very low. Very low regions are often **intrinsically disordered**, which is a real biological signal and not just failure.

## AlphaFold 3, RoseTTAFold and language-model folding

- **AlphaFold 3** (Abramson et al., *Nature* 2024) predicts **joint structures of complexes** containing proteins, **DNA, RNA, small-molecule ligands, ions** and modified residues. It replaces the Evoformer with a lighter **Pairformer** and the structure module with a **diffusion module** that generates atom coordinates directly (like image diffusion models denoise pixels). It reports large gains for protein–ligand interactions over docking tools. It is available via the AlphaFold Server, with code and weights released for academic use in November 2024.
- **RoseTTAFold** (Baek et al., *Science* 2021, Baker lab): a three-track network (sequence, distance, 3D). Its all-atom successor handles complexes with nucleic acids and small molecules.
- **ESMFold** (Lin et al., *Science* 2023, Meta): uses the **ESM-2** protein language model (up to 15B parameters, trained only on sequences) and predicts structure from a **single sequence**, with no MSA, much faster than AlphaFold 2. It was used to predict ~600 million metagenomic proteins (ESM Metagenomic Atlas).
- **ESM3** (Hayes et al., *Science* 2025, EvolutionaryScale): a multimodal generative model over sequence, structure and function. It generated **esmGFP**, a bright fluorescent protein with only 58% identity to known fluorescent proteins.

{{yt:P_fHJIYENdI|AlphaFold - The Most Useful Thing AI Has Ever Done (Veritasium)}}

## Protein design and the 2024 Nobel Prize

Prediction asks sequence → structure. **Design** asks the inverse: what sequence will fold into a structure with a desired function?

- **RFdiffusion** (Watson et al., *Nature* 2023): a diffusion model that generates **new protein backbones** (binders, symmetric assemblies, enzymes). A cryo-EM structure of one designed binder bound to influenza haemagglutinin closely matched the design.
- **ProteinMPNN** (Dauparas et al., *Science* 2022): designs sequences for a given backbone.
- Typical loop: RFdiffusion backbone → ProteinMPNN sequence → AlphaFold check → lab test.

**Nobel Prize in Chemistry 2024:** one half to **David Baker** (University of Washington) “for computational protein design”; the other half jointly to **Demis Hassabis** and **John Jumper** (Google DeepMind) “for protein structure prediction.”

## From structure to variants: AlphaMissense

**AlphaMissense** (Cheng et al., *Science* 2023) adapts AlphaFold to score **missense variants** (single amino-acid changes). It classified all **71 million** possible human missense variants, labelling 89% as likely benign or likely pathogenic, versus 0.1% that had been confirmed by human experts. It is used to prioritize variants in rare-disease diagnostics, alongside clinical evidence and never instead of it.

## Limitations researchers must know

- Predictions are mostly a **single static structure**; proteins are dynamic, with multiple conformations, allostery and folding pathways not captured.
- **Disordered regions**, rare **orphan proteins** with shallow MSAs, and **antibody–antigen** interfaces remain hard.
- AlphaFold is not reliable for predicting **effects of point mutations on stability** directly; use dedicated models.
- Complex predictions (AF3) can **hallucinate** plausible-looking structures in low-confidence regions, so always check PAE/pLDDT.
- High confidence ≠ biological truth in a specific context (ligands, membranes, post-translational modifications).

:::sota Research directions (2025–26)
Conformational ensembles and dynamics; protein–ligand co-folding for drug discovery; generative design of enzymes and binders (de novo antibodies); protein language models for function prediction; integrating structure into variant interpretation.
:::
