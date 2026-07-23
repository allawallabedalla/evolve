"""SPIKE v3: der artefaktfreie Test. Finde eine Umwelt mit INNEREM Groessen-
Optimum (Basis-Fitness peakt bei mittlerer size). Zeige dann: Konkurrenz
hoehlt genau diesen Gipfel aus -> Population spaltet in zwei flankierende
Cluster (klassisches evolutionaeres Branching, kein Rand-Effekt)."""
import sys, os, math, random, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "oracle"))
from reference_model import fitness, SIZE, TRAITS
ROOT=os.path.join(os.path.dirname(__file__),"..")
phys=json.load(open(os.path.join(ROOT,"physics.json"))); NG=len(TRAITS)
def clamp01(x): return 0.0 if x<0 else 1.0 if x>1 else x

# Suche Umwelt mit innerem size-Optimum: Groesse muss sich lohnen (Reichweite bei
# hoher foodHeight, Verteidigung bei Raeuberdruck) aber teuer bleiben.
def argmax_size(env, base):
    best=(-1,0)
    for i in range(21):
        s=i/20; g=base[:]; g[SIZE]=s; f=fitness(g,env,phys)
        if f>best[0]: best=(f,s)
    return best[1]
base=[0.4,0.5,0.7,0.6,0.3,0.05,0.6,0.5,0,0][:NG]
cands=[]
for pred in (.4,.7,.9):
    for fh in (.5,.7,.9):
        for fa in (.5,.7):
            env={"temperature":.5,"predation":pred,"foodAbundance":fa,"foodHeight":fh,"light":.4,"water":.5}
            sopt=argmax_size(env,base)
            if 0.3<=sopt<=0.7: cands.append((sopt,env))
print("Umwelten mit innerem size-Optimum:",len(cands))
if not cands:
    print("keine gefunden"); sys.exit()
env=cands[len(cands)//2][1]
print("gewaehlt:",env)
print("(0) Basis-Fitness ueber size:")
for i in range(21):
    s=i/20; g=base[:]; g[SIZE]=s; f=fitness(g,env,phys)
    print(f"   {s:.2f} f={f:.3f} {'#'*int(f*55)}")

def run(sigma_c,gens=600,N=400,sel=2.0,mut=0.03,seed=1,compete=True):
    rng=random.Random(seed)
    pop=[[clamp01(0.5+rng.gauss(0,0.03)) for _ in range(NG)] for _ in range(N)]
    for _ in range(gens):
        sz=[ind[SIZE] for ind in pop]
        if compete:
            a=1.0/(2*sigma_c*sigma_c)
            n=[sum(math.exp(-(sz[i]-sz[j])**2*a) for j in range(N))/N for i in range(N)]
            w=[(fitness(pop[i],env,phys)**sel)/(n[i]+1e-9) for i in range(N)]
        else:
            w=[fitness(pop[i],env,phys)**sel for i in range(N)]
        t=sum(w) or 1; wn=[x/t for x in w]
        pa=rng.choices(pop,weights=wn,k=N); pb=rng.choices(pop,weights=wn,k=N)
        pop=[[clamp01((b[k] if rng.random()<0.5 else a2[k])+rng.gauss(0,mut)) for k in range(NG)] for a2,b in zip(pa,pb)]
    return [ind[SIZE] for ind in pop]
def hist(s,bins=20):
    c=[0]*bins
    for x in s: c[min(bins-1,int(x*bins))]+=1
    mx=max(c) or 1
    return "\n".join(f"   {b/bins:.2f} |{'#'*int(34*c[b]/mx)} {c[b]}" for b in range(bins))
def peakvalley(s):
    lo=sum(1 for x in s if x<0.34)/len(s); mid=sum(1 for x in s if .34<=x<.66)/len(s); hi=sum(1 for x in s if x>=.66)/len(s)
    return f"low={lo:.2f} mid={mid:.2f} high={hi:.2f}"

print("\n(1) OHNE Konkurrenz (erwartet: ein Cluster auf dem inneren Gipfel):")
s=run(0,compete=False); print("  ",peakvalley(s)); print(hist(s))
print("\n(2) MIT Konkurrenz sigma_c=0.15 (erwartet: Gipfel ausgehoehlt, zwei Flanken):")
s=run(0.15); print("  ",peakvalley(s)); print(hist(s))
