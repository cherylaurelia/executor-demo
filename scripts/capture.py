import json,sys,urllib.request,datetime
port,keyfile,label,out=sys.argv[1:5]
KEY=json.load(open(keyfile))['apiKey']; URL=f'http://127.0.0.1:{port}/mcp'; sid=None
def rpc(method,params,id=1):
    global sid
    h={'content-type':'application/json','accept':'application/json, text/event-stream','authorization':'Bearer '+KEY}
    if sid: h['mcp-session-id']=sid
    body={'jsonrpc':'2.0','method':method,'params':params}
    if id is not None: body['id']=id
    r=urllib.request.urlopen(urllib.request.Request(URL,json.dumps(body).encode(),h),timeout=60)
    sid=r.headers.get('mcp-session-id') or sid
    t=r.read().decode()
    if not t: return None
    if t.lstrip().startswith('{'): return json.loads(t)
    for line in t.splitlines():
        if line.startswith('data:'): return json.loads(line[5:])
init=rpc('initialize',{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'capture','version':'1'}})
rpc('notifications/initialized',{},None)
steps=[]
for name,args in [('search',{'namespace':'paint'}),('describe',{'paths':['tools.paint.paint']}),
                  ('call',{'calls':{'path':'tools.paint.paint','input':{'nested':'green','literalField':'red'}}}),
                  ('call',{'calls':{'path':'tools.paint.paint','input':{'nested':'red','literalField':'red'}}})]:
    res=rpc('tools/call',{'name':name,'arguments':args})['result']
    steps.append({'tool':name,'arguments':args,'structuredContent':res.get('structuredContent'),'isError':res.get('isError')})
json.dump({'label':label,'server':init['result']['serverInfo'],'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),'steps':steps},open(out,'w'),indent=1)
print(json.dumps(init['result']['serverInfo']))
for s in steps: print(s['tool'], json.dumps(s['structuredContent'])[:260])
