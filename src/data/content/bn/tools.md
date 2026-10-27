Lecture-গুলো আপনাকে algorithm শেখায়। কিন্তু গবেষণা করতে গেলে একটা ব্যবহারিক স্তরও জানা দরকার: biological data কোথায় রাখা থাকে, file-গুলো দেখতে কেমন, আর মানুষ আসলে কোন কোন tool চালায়। এই module সেই স্তরটা নিয়েই, ঠিক ততটুকু গভীরে যতটুকু course অনুসরণ করতে আর নিজের বিশ্লেষণ শুরু করতে আপনার লাগবে।

:::tip এটা আগে পড়ে নেওয়ার দরকার নেই
কোনো পাঠে যখন কোনো database, file format বা pipeline-এর কথা আসে, তখন সেখান থেকে এখানে link দেওয়া থাকে (🧱 *Stuck? Quick refresher*)। যখন সত্যিকারের data নিয়ে কাজ শুরু করবেন, তখন ফিরে আসুন।
:::

## যেসব database আপনি ব্যবহার করবেন

প্রায় প্রতিটা বিশ্লেষণ শুরু হয় public database থেকে। প্রধান database-গুলো মনে রাখার সহজ উপায় হলো: কোনটায় কী ধরনের তথ্য রাখা থাকে।

| তথ্যের ধরন | Database | মন্তব্য |
|---|---|---|
| Nucleotide sequence | **GenBank** (NCBI), **ENA** (EMBL-EBI), **DDBJ** | তিনটাই একে অপরের হুবহু প্রতিলিপি রাখে (একসাথে এদের বলে INSDC) |
| কাঁচা sequencing read | **SRA** (NCBI), ENA | SRA Toolkit দিয়ে FASTQ নামানো যায় (`fasterq-dump`) |
| Reference genome আর gene annotation | **NCBI RefSeq**, **Ensembl**, **UCSC Genome Browser** | মানুষের assembly: GRCh38 আর T2T-CHM13 |
| Protein | **UniProt** | Swiss-Prot = মানুষ হাতে যাচাই করেছে; TrEMBL = স্বয়ংক্রিয়ভাবে তৈরি |
| 3D গঠন | **PDB** (পরীক্ষাগারে নির্ণীত), **AlphaFold DB** (অনুমিত) | প্রতিটা atom-এর স্থানাঙ্ক |
| Expression | **GEO** (NCBI), **ArrayExpress/BioStudies** (EBI), recount3, ARCHS4 | microarray আর RNA-seq গবেষণা |
| Single cell | CELLxGENE, Human Cell Atlas | annotate করা cell atlas |
| Variant | dbSNP, **ClinVar**, **gnomAD** | জনগোষ্ঠীতে কত ঘন ঘন দেখা যায় আর চিকিৎসাগত গুরুত্ব |
| Protein domain আর family | **Pfam** (InterPro-র ভেতরে), PROSITE | profile HMM |
| Interaction আর pathway | STRING, BioGRID, KEGG, Reactome | network |
| Gene-এর কাজ বোঝানোর term | **Gene Ontology (GO)** | enrichment analysis-এ ব্যবহার হয় |

**Identifier** দিয়েই এক database আরেক database-এর সাথে যুক্ত হয়। ধরা যাক মানুষের একটা gene: তার নাম হতে পারে `BRCA1` (symbol), `ENSG00000012048` (Ensembl gene), `672` (NCBI Gene) আর `P38398` (UniProt protein), সবগুলোই একই gene। এক ধরনের ID থেকে আরেক ধরনে রূপান্তর করা (যেমন BioMart বা `mygene` দিয়ে) প্রায় প্রতিটা project-এর একটা নিয়মিত ধাপ।

## File format

এগুলো পড়তে আর লিখতে আপনার অনেক সময় যাবে। প্রতিটাই আসলে সাধারণ text (অথবা সাধারণ text-এরই একটা compressed binary রূপ)।

**FASTA:** sequence রাখার format। প্রথমে `>` দিয়ে শুরু হওয়া একটা header line, তারপর এক বা একাধিক line জুড়ে sequence।

```text
>NC_001422.1 Escherichia phage phiX174, complete genome
GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTA...
```

**FASTQ:** sequencing read, সাথে প্রতিটা base-এর quality। প্রতিটা read-এর জন্য চারটা line: `@name`, sequence, `+`, আর quality string। প্রতিটা quality অক্ষর একটা Phred score Q-কে প্রকাশ করে: সেই অক্ষর, যার ASCII code হলো Q + 33 (Sequencing পাঠ)।

**SAM / BAM / CRAM:** reference-এ align করা read। প্রতিটা line-এ থাকে read-এর নাম, chromosome, 1-based অবস্থান, **MAPQ** (mapping quality: অবস্থানটা যে ঠিক, তার আস্থা, Phred স্কেলে) আর একটা **CIGAR** string, যা alignment-টা কেমন তা বর্ণনা করে। যেমন `50M2I48M` মানে 50টা aligned base, তারপর read-এ 2 base-এর একটা insertion, তারপর আবার 48টা aligned base। BAM হলো SAM-এরই compressed binary রূপ; CRAM reference-এর সাথে তুলনা করে আরও বেশি compress করে।

**VCF:** variant call রাখার format।

```text
#CHROM  POS      ID         REF  ALT  QUAL  FILTER  INFO   FORMAT  SAMPLE1
chr1    1234567  .          G    A    812   PASS    DP=41  GT      0/1
```

এখানে `0/1` হলো genotype: একটা reference allele আর একটা alternative allele (অর্থাৎ heterozygous)।

**BED, GFF3 আর GTF:** genome-এর বিভিন্ন অংশের সীমানা (interval) আর gene annotation (gene, exon, transcript)।

:::warn Coordinate system
**BED হলো 0-based আর half-open** (প্রথম 10টা base জুড়ে থাকা একটা feature লেখা হয় `0 10`)। **GFF, GTF, SAM আর VCF হলো 1-based আর inclusive** (একই feature সেখানে `1 10`)। এই দুটো গুলিয়ে ফেললে এক ঘর এদিক-ওদিক হওয়া (off-by-one) ভুল হয়, যা ধরা খুবই কঠিন।
:::

**PDB / mmCIF:** 3D গঠন; প্রতিটা atom-এর জন্য একটা line, তাতে x, y, z স্থানাঙ্ক। AlphaFold-এর file-এ প্রতিটা residue-এর আস্থার মান (pLDDT) রাখা থাকে B-factor কলামে।

**Newick:** nested বন্ধনী আর branch length দিয়ে tree লেখার format, যেমন `((A:2,B:2):1,(C:2,D:2):1);`।

**h5ad, loom, MTX:** single-cell count matrix (genes × cells)। এগুলোর বেশিরভাগ ঘরই 0, তাই sparse আকারে রাখা হয়।

## Python-এ FASTA আর FASTQ পড়া

অন্তত একবার নিজের হাতে দুটো format parse করে দেখা উচিত; তাতে format-গুলো মাথায় গেঁথে যায়।

```python
def read_fasta(path):
    """Return {header: sequence} for a FASTA file."""
    seqs, name = {}, None
    for line in open(path):
        line = line.strip()
        if line.startswith(">"):
            name = line[1:]
            seqs[name] = []
        elif name:
            seqs[name].append(line)
    return {k: "".join(v) for k, v in seqs.items()}

def read_fastq(path):
    """Yield (name, sequence, qualities as integers)."""
    with open(path) as f:
        while True:
            name = f.readline().strip()
            if not name:
                break
            seq = f.readline().strip()
            f.readline()                      # the '+' line
            qual = f.readline().strip()
            yield name[1:], seq, [ord(c) - 33 for c in qual]
```

তবে সত্যিকারের কাজে পরীক্ষিত library ব্যবহার করুন: Biopython-এর `SeqIO.parse(path, "fasta")` বা `"fastq"`, অথবা BAM আর VCF-এর জন্য `pysam`। Course-এর notebook *Sequence_reads.ipynb* ঠিক এই কাজটাই করে, φX174 genome আর একটা সত্যিকারের FASTQ file দিয়ে।

## সাধারণ বিশ্লেষণের workflow

বাস্তব বিশ্লেষণে অনেকগুলো tool পরপর জুড়ে কাজ করতে হয়। নিচের প্রতিটা তীরচিহ্ন একটা আলাদা program, আর প্রতিটাই course-এর কোনো না কোনো পাঠের সাথে যুক্ত।

**Variant calling (DNA):**
FASTQ → quality control (FastQC, fastp) → reference-এ **read map করা** (BWA-MEM, Bowtie2; *Read Mapping*) → sort করা আর PCR duplicate চিহ্নিত করা (samtools, Picard) → **variant call করা** (GATK HaplotypeCaller, DeepVariant) → annotate করা (VEP; gnomAD frequency) → ব্যাখ্যা।

**Bulk RNA-seq:**
FASTQ → QC → splicing বুঝতে পারে এমন alignment (STAR, HISAT2) অথবা pseudo-alignment (Salmon, kallisto) → **count matrix** (genes × samples) → normalization আর differential expression (DESeq2, edgeR) → **clustering আর PCA** (*Gene Expression* পাঠ) → GO / pathway enrichment।

RNA-seq matrix-এর সংখ্যাগুলো কোথা থেকে আসে, ভিডিওটা সেটা ব্যাখ্যা করে; এই matrix-ই clustering আর PCA পাঠের input।

{{video:tlf6wYJrwKY}}

**Single-cell RNA-seq:**
Cell Ranger বা STARsolo → count matrix (genes × cells) → QC (mitochondrial ভাগ বেশি এমন cell আর doublet বাদ দেওয়া) → normalize → highly variable gene বাছাই → **PCA** → nearest-neighbour graph → Leiden clustering → **UMAP / t-SNE** → cell type চিহ্নিত করা (Python-এ Scanpy, R-এ Seurat)।

**Workflow manager** (Snakemake, Nextflow আর nf-core pipeline-গুলো) এই পুরো শিকল এমনভাবে চালায় যেন ফল আবার হুবহু পাওয়া যায়; কোনো ধাপ ব্যর্থ হলে সেখান থেকে আবার চালায়, আর কোন tool-এর কোন version ব্যবহার হলো তা লিখে রাখে।

## Gene Ontology আর enrichment analysis

Gene-গুলো cluster করার পর, বা differentially expressed gene খুঁজে পাওয়ার পর, আপনার হাতে থাকে শুধু gene-এর নামের একটা তালিকা। **Enrichment analysis** সেই তালিকাকে biology-র ভাষায় অনুবাদ করে, যেমন: "cluster 3 আসলে immune response নিয়ে"।

**Gene Ontology (GO)** হলো gene-এর কাজ বোঝানোর জন্য একটা নিয়ন্ত্রিত শব্দভান্ডার (controlled vocabulary), যার তিনটা শাখা:
- **Biological Process** (যেমন *DNA replication*, *immune response*),
- **Molecular Function** (যেমন *DNA binding*, *kinase activity*),
- **Cellular Component** (যেমন *nucleus*, *mitochondrion*)।

Term-গুলো মিলে একটা **directed acyclic graph** তৈরি করে: একটা নির্দিষ্ট term (*DNA replication initiation*)-এর ওপরে থাকে আরও সাধারণ parent term (*DNA replication*, তারও ওপরে *DNA metabolic process*)। কোনো gene একটা term-এ annotate করা থাকলে ধরে নেওয়া হয় সেটা ওই term-এর সব পূর্বপুরুষ term-এও annotate করা।

**Over-representation test।** ধরা যাক genome-এ মোট N = 20,000টা gene, তার মধ্যে K = 400টা *immune response*-এ annotate করা, আর আপনার cluster-এ n = 100টা gene, যার k = 15টা immune gene। শুধু কাকতালীয়ভাবে হলে আশা করতেন $100 \times 400/20{,}000 = 2$টা। তাহলে 15টা পাওয়া কি অবাক হওয়ার মতো? **Hypergeometric test** (Fisher's exact test) হিসাব করে দেয়, এলোমেলোভাবে 100টা gene বাছলে 15 বা তার বেশি immune gene পাওয়ার সম্ভাবনা কত। এখানে সেটা খুবই ক্ষুদ্র, তাই বলা হয় term-টা **enriched**।

যেহেতু একসাথে হাজার হাজার GO term পরীক্ষা করা হয়, তাই p-value-গুলো **multiple testing**-এর জন্য সংশোধন করতে হয়, সাধারণত Benjamini–Hochberg FDR দিয়ে (Math foundation, *Statistical significance*)। দুটো ব্যবহারিক সতর্কতা: সবসময় সঠিক **background** ব্যবহার করুন (যে gene-গুলো আপনার পরীক্ষায় আদৌ ধরা পড়া সম্ভব ছিল, পুরো genome নয়), আর মনে রাখুন যে বেশি গবেষণা হওয়া gene-গুলোর annotation-ও বেশি।

**GO-র বাইরে:** pathway database (KEGG, Reactome) একইভাবে কাজ করে; **GSEA** (gene set enrichment analysis) একটা নির্দিষ্ট সীমা দিয়ে কাটা তালিকার বদলে সব gene-এর একটা *ক্রমানুসারে সাজানো* (ranked) তালিকা ব্যবহার করে। Tool: g:Profiler, clusterProfiler (R), Enrichr।

## Python আর R-এর হাতিয়ার

**Python:**
- **Biopython** (FASTA/FASTQ parse করা, দুটো sequence-এর alignment, NCBI Entrez থেকে তথ্য আনা), **pysam** (BAM, VCF), scikit-bio।
- Matrix, table, পরিসংখ্যান, clustering, PCA, t-SNE আর classifier-এর জন্য **NumPy, pandas, SciPy, scikit-learn**; plot আঁকার জন্য matplotlib আর seaborn।
- Single cell-এর জন্য **Scanpy**; deep learning-এর জন্য **PyTorch**; protein আর DNA language model-এর জন্য **fair-esm** আর Hugging Face।

**R / Bioconductor:** DESeq2 আর edgeR (differential expression), Seurat (single cell), clusterProfiler (enrichment)। Genomics-এর পরিসংখ্যানের বড় একটা অংশ এখানেই থাকে।

**Command line:** samtools, bcftools, bedtools, BLAST+, আর Unix-এর মৌলিক command (`grep`, `awk`, `sort`, `zcat`)। বেশিরভাগ tool Linux server-এ চলে।

**Environment:** tool install করুন **conda/mamba** দিয়ে (Bioconda channel-এ প্রায় সবকিছুই আছে) অথবা container দিয়ে (Docker, Apptainer), আর কোন version ব্যবহার করলেন তা লিখে রাখুন, যাতে বিশ্লেষণটা পরে হুবহু আবার করা যায়।

## অনুশীলন আর শেখা চালিয়ে যাওয়া

- **Rosalind** হলো সেই সমস্যা-সমাধানের platform যা এই course ব্যবহার করে। এর *Bioinformatics Textbook Track* অধ্যায় ধরে ধরে Compeau & Pevzner অনুসরণ করে, আর এই site-এর প্রতিটা algorithm-এর **Further reading** অংশে তার Rosalind সমস্যার link দেওয়া আছে। একটা algorithm নিজে implement করে grade পাওয়াই সেটা সত্যিকারভাবে বোঝার সবচেয়ে দ্রুত উপায়।
- কোনো প্রকাশিত গবেষণাপত্রের একটা figure তার GEO/SRA data দিয়ে শুরু থেকে শেষ পর্যন্ত নিজে বানিয়ে দেখুন। এই module-এর প্রায় প্রতিটা ব্যবহারিক সমস্যার মুখোমুখি হবেন।
- নতুন কোনো tool-এর ওপর ভরসা করার আগে **benchmark paper** (একাধিক tool-কে পাশাপাশি তুলনা করা গবেষণা) পড়ুন, আর নিজের ক্ষেত্রের bioRxiv preprint-গুলোর খোঁজ রাখুন।

{{video:6oHl7hNWn2o}}
