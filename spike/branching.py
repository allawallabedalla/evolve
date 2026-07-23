"""SPIKE v2: sauber kontrolliert. Frage: erzeugt frequenzabhaengige Konkurrenz
in UNSEREM Rahmen echtes Branching - oder nur Rand-Artefakte?

Kontrollen:
 (0) Basis-Fitness-Profil ueber size (fixe Landschaft) - Mitte- oder Rand-Optimum?
 (1) Kontrolllauf OHNE Konkurrenz - wohin geht size von allein?
 (2) Konkurrenz AN, mehrere sigma_c.
Rand-Artefakt-Korrektur: Konkurrenz-Dichte wird durch die *lokale Ressource*
(Basis-Fitness) geteilt, sodass leere Raender nicht automatisch gewinnen."""
import sys, os, math, random, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "oracle"))
from reference_model import fitness, SIZE, TRAITS
ROOT = os.path.join(os.path.dirname(__file__), "..")
phys = json.load(open(os.path.join(ROOT, "physics.json")))
NG = len(TRAITS)
def clamp01(x): return 0.0 if x<0 else 1.0 if x>1 else x

env={"temperature":.5,"predation":.35,"foodAbundance":.7,"foodHeight":.35,"light":.45,"water":.5}

# (0) Basis-Fitness ueber size, uebrige Gene auf einem typischen Tier-Profil
def size_profile():
    base=[0.4,0.5,0.6,0.5,0.3,0.05,0.6,0.3,0,0][:NG]
    print("(0) Basis-Fitness ueber size (fixe Landschaft, sonst Tier-Profil):")
    for s in [i/20 for i in range(21)]:
        g=base[:]; g[SIZE]=s
        f=fitness(g,env,phys)
        print(f"   size {s:.2f}  f={f:.3f} {'#'*int(f*60)}")

def run(sigma_c, gens=500, N=400, sel_power=2.0, mut_sd=0.03, seed=1, compete=True):
    rng=random.Random(seed)
    pop=[[clamp01(0.5+rng.gauss(0,0.03)) for _ in range(NG)] for _ in range(N)]
    for g in range(gens):
        sizes=[ind[SIZE] for ind in pop]
        if compete:
            inv2s2=1.0/(2*sigma_c*sigma_c)
            n=[]
            for i in range(N):
                xi=sizes[i]; s=0.0
                for j in range(N):
                    d=xi-sizes[j]; s+=math.exp(-d*d*inv2s2)
                n.append(s/N)  # mittlere Konkurrenz-Dichte (0..1)
            w=[(fitness(pop[i],env,phys)**sel_power)/(n[i]+1e-9) for i in range(N)]
        else:
            w=[fitness(pop[i],env,phys)**sel_power for i in range(N)]
        tot=sum(w) or 1.0; wn=[x/tot for x in w]
        pa=rng.choices(pop,weights=wn,k=N); pb=rng.choices(pop,weights=wn,k=N)
        pop=[[clamp01((b[k] if rng.random()<0.5 else a[k])+rng.gauss(0,mut_sd)) for k in range(NG)] for a,b in zip(pa,pb)]
    return [ind[SIZE] for ind in pop]

def hist(sizes,bins=20):
    c=[0]*bins
    for s in sizes: c[min(bins-1,int(s*bins))]+=1
    mx=max(c) or 1
    return "\n".join(f"   {b/bins:.2f} |{'#'*int(34*c[b]/mx)} {c[b]}" for b in range(bins))

def verdict(sizes):
    # zwei Seitenmoden + leere Mitte? Mitte = [0.34,0.66]
    lo=sum(1 for s in sizes if s<0.34)/len(sizes)
    mid=sum(1 for s in sizes if 0.34<=s<0.66)/len(sizes)
    hi=sum(1 for s in sizes if s>=0.66)/len(sizes)
    branch = lo>0.2 and hi>0.2 and mid<0.5*min(lo,hi)
    return f"low={lo:.2f} mid={mid:.2f} high={hi:.2f}  -> {'BRANCHING' if branch else ('unimodal' if mid>=max(lo,hi) else 'einseitig/spread')}"

size_profile()
print("\n(1) KONTROLLE ohne Konkurrenz:")
s=run(0,compete=False); print("  ",verdict(s)); print(hist(s))
for sc in [0.35, 0.20, 0.10]:
    print(f"\n(2) Konkurrenz sigma_c={sc}:")
    s=run(sc); print("  ",verdict(s)); print(hist(s))
