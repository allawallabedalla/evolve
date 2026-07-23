"""SPIKE v4 (sauberer Nachweis): Dieckmann-Doebeli mit unserer Fitness als Faktor.
w_i = f_i^s * K(size_i) / n_i  mit Ressourcenverteilung K(x)=Gauss(0.5, sigma_K)
(interior peak -> neutralisiert Rand-Artefakte) und Konkurrenz-Kernel n_i(sigma_c).
Theorie: sigma_c < sigma_K -> Branching; sigma_c > sigma_K -> ein Generalist."""
import sys, os, math, random, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "oracle"))
from reference_model import fitness, SIZE, TRAITS
ROOT=os.path.join(os.path.dirname(__file__),".."); phys=json.load(open(os.path.join(ROOT,"physics.json"))); NG=len(TRAITS)
def clamp01(x): return 0.0 if x<0 else 1.0 if x>1 else x
env={"temperature":.5,"predation":.4,"foodAbundance":.7,"foodHeight":.35,"light":.45,"water":.5}
sigma_K=0.25
def K(x): return math.exp(-(x-0.5)**2/(2*sigma_K*sigma_K))
def run(sigma_c,gens=600,N=400,sel=2.0,mut=0.03,seed=1,compete=True):
    rng=random.Random(seed)
    pop=[[clamp01(0.5+rng.gauss(0,0.03)) for _ in range(NG)] for _ in range(N)]
    for _ in range(gens):
        sz=[ind[SIZE] for ind in pop]
        if compete:
            a=1.0/(2*sigma_c*sigma_c)
            n=[sum(math.exp(-(sz[i]-sz[j])**2*a) for j in range(N))/N for i in range(N)]
            w=[(fitness(pop[i],env,phys)**sel)*K(sz[i])/(n[i]+1e-9) for i in range(N)]
        else:
            w=[(fitness(pop[i],env,phys)**sel)*K(sz[i]) for i in range(N)]
        t=sum(w) or 1; wn=[x/t for x in w]
        pa=rng.choices(pop,weights=wn,k=N); pb=rng.choices(pop,weights=wn,k=N)
        pop=[[clamp01((b[k] if rng.random()<0.5 else a2[k])+rng.gauss(0,mut)) for k in range(NG)] for a2,b in zip(pa,pb)]
    return [ind[SIZE] for ind in pop]
def hist(s,bins=20):
    c=[0]*bins
    for x in s: c[min(bins-1,int(x*bins))]+=1
    mx=max(c) or 1
    return "\n".join(f"   {b/bins:.2f} |{'#'*int(34*c[b]/mx)} {c[b]}" for b in range(bins))
def pv(s):
    lo=sum(1 for x in s if x<0.34)/len(s); mid=sum(1 for x in s if .34<=x<.66)/len(s); hi=sum(1 for x in s if x>=.66)/len(s)
    br = lo>0.2 and hi>0.2 and mid<0.6*min(lo,hi)
    return f"low={lo:.2f} mid={mid:.2f} high={hi:.2f}  -> {'BRANCHING' if br else 'unimodal/spread'}"
print(f"Ressource K(x): Gauss um 0.5, sigma_K={sigma_K}")
print("\n(1) Kontrolle OHNE Konkurrenz (erwartet: ein Cluster bei size=0.5):")
s=run(0,compete=False); print("  ",pv(s)); print(hist(s))
for sc in [0.40, 0.10]:
    rel = "breiter als Ressource -> Generalist erwartet" if sc>sigma_K else "schmaler als Ressource -> BRANCHING erwartet"
    print(f"\n(2) sigma_c={sc}  ({rel}):")
    s=run(sc); print("  ",pv(s)); print(hist(s))
