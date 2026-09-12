import { randomUUID, randomBytes } from 'node:crypto';
import { database, transaction } from './db.js';
import { digest, hashPassword, checkPassword, cookie, userView, assert, text, uuid } from './security.js';
const send = (res,status,data,headers={}) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}); res.end(JSON.stringify(data)); };
async function input(req) { let raw=''; for await (const chunk of req) { raw+=chunk; assert(Buffer.byteLength(raw)<=100000,'Request too large',413); } try { const data=JSON.parse(raw||'{}'); assert(data && typeof data==='object' && !Array.isArray(data),'Expected object'); return data; } catch(e) { if(e.status)throw e; throw Object.assign(new Error('Invalid JSON'),{status:400}); } }
const tokenOf = req => /(?:^|;\s*)unilink_session=([^;]*)/.exec(req.headers.cookie||'')?.[1]||'';
async function auth(req) { const [rows]=await database().execute("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP(3) AND u.status='active'",[digest(tokenOf(req))]); assert(rows.length,'Authentication required',401); return rows[0]; }
async function session(client,id) { const token=randomBytes(32).toString('hex'); await client.execute('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 7 DAY))',[digest(token),id]); return token; }
const recordView = r => ({...r.data,id:r.id,ownerId:r.owner_id,parentId:r.parent_id,createdAt:r.created_at,updatedAt:r.updated_at});
const rules = {
  clubs:{roles:['club','admin'],fields:['name','description','year'],required:['name'],public:true},
  jobs:{roles:['recruiter','admin'],fields:['title','description','company','location','status'],required:['title','description'],public:true},
  auctions:{roles:['club','recruiter','admin'],fields:['title','description','category','ends','minimum','increment'],required:['title','ends'],public:true},
  studyGroups:{roles:['student','admin'],fields:['name','subject','description'],required:['name'],public:true},
  studySessions:{roles:['student','admin'],fields:['name','subject','date','time','description'],required:['name','date'],public:true},
  clubEvents:{club:true,fields:['name','date','time','venue','capacity'],required:['name','date','venue'],public:true},
  clubNotices:{club:true,fields:['title','body','audience'],required:['title','body'],public:true},
  clubTransactions:{club:true,fields:['title','amount','category','date'],required:['title','amount']},
  announcements:{roles:['admin'],fields:['title','body'],required:['title','body'],public:true},
  partnerships:{roles:['admin'],fields:['name','description','status'],required:['name']},
  reports:{fields:['title','body'],required:['title','body']},
  savedCandidates:{roles:['recruiter','admin'],fields:['userId'],required:['userId']},
  partnerRequests:{roles:['student','admin'],fields:['toUserId','message'],required:['toUserId']}
  ,applications:{roles:['student','recruiter','admin'],fields:['jobId','coverLetter','status'],required:['jobId']}
  ,bids:{roles:['student','recruiter','club','admin'],fields:['auctionId','amount'],required:['auctionId','amount']}
};
async function notify(c,userId,title,body='') { await c.execute('INSERT INTO notifications(id,user_id,title,body) VALUES(?,?,?,?)',[randomUUID(),userId,title,body]); }
async function clubPermission(c,clubId,user) {
  const [rows]=await c.execute("SELECT r.id FROM records r WHERE r.id=? AND r.kind='clubs' AND (r.owner_id=? OR EXISTS(SELECT 1 FROM club_members m WHERE m.club_id=r.id AND m.user_id=? AND m.role='manager'))",[uuid(clubId),user.id,user.id]);
  assert(user.role==='admin'||rows.length,'Club manager access required',403);
}
async function limit(req,email) {
  const key=digest('auth:'+email);
  await database().execute('INSERT INTO auth_limits (`key`,attempts,reset_at) VALUES (?,1,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE)) ON DUPLICATE KEY UPDATE attempts=IF(reset_at<UTC_TIMESTAMP(3),1,attempts+1), reset_at=IF(reset_at<UTC_TIMESTAMP(3),DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),reset_at)',[key]);
  const [[row]]=await database().execute('SELECT attempts FROM auth_limits WHERE `key`=?',[key]);
  assert(row.attempts<=20,'Too many attempts; try again later',429);
}
export async function handler(req,res) {
  try {
    const url=new URL(req.url,'http://localhost'); const path=url.pathname; const method=req.method;
    if(!['GET','HEAD'].includes(method)) {
      const origin=req.headers.origin;
      const expected=process.env.APP_ORIGIN || `${process.env.VERCEL?'https':'http'}://${req.headers.host}`;
      assert(!origin||origin===expected,'Origin not allowed',403);
      assert(req.headers['sec-fetch-site']!=='cross-site','Cross-site request rejected',403);
      assert((req.headers['content-type']||'').split(';')[0]==='application/json','Use application/json',415);
    }
    if(path==='/api/health' && method==='GET') { await database().execute('SELECT 1'); return send(res,200,{status:'ok',database:'connected'}); }
    if(['/api/auth/register','/api/auth/login'].includes(path) && method==='POST') {
      const data=await input(req), email=text(data.email,'email',255).toLowerCase(); assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Invalid email');
      const password=text(data.password,'password',128); await limit(req,email);
      let user,token;
      if(path.endsWith('register')) {
        assert(['student','club','recruiter'].includes(data.role),'Public registration does not allow this role',403); assert(password.length>=8,'Password must have at least 8 characters');
        const id=randomUUID(), first=text(data.firstName,'first name',100), last=text(data.lastName,'last name',100), hashed=await hashPassword(password);
        const profile={}; for(const key of ['university','department','year']) if(data[key]!==undefined)profile[key]=text(data[key],key,200,false);
        token=await transaction(async c=>{ await c.execute('INSERT INTO users(id,email,password_hash,first_name,last_name,role,profile) VALUES(?,?,?,?,?,?,?)',[id,email,hashed,first,last,data.role,JSON.stringify(profile)]); return session(c,id); });
        user={id,email,first_name:first,last_name:last,role:data.role,profile,status:'active'};
      } else {
        const [rows]=await database().execute('SELECT * FROM users WHERE email=?',[email]); user=rows[0];
        assert(user && user.status==='active' && await checkPassword(password,user.password_hash),'Invalid email or password',401);
        assert(!data.role||data.role===user.role||(data.role==='university'&&user.role==='admin'),'Account role mismatch',403);
        token=await session(database(),user.id);
      }
      return send(res,path.endsWith('register')?201:200,{user:userView(user)},{'Set-Cookie':cookie(token)});
    }
    if(path==='/api/auth/logout'&&method==='POST') { await database().execute('DELETE FROM sessions WHERE token_hash=?',[digest(tokenOf(req))]);return send(res,200,{ok:true},{'Set-Cookie':cookie('',true)}); }
    const user=await auth(req);
    if(path==='/api/auth/me'&&method==='GET')return send(res,200,{user:userView(user)});
    if(path==='/api/profile' && method==='PATCH') {
      const data=await input(req), profile={...user.profile};
      for(const key of ['university','department','year','phone','bio','city','availability'])if(data[key]!==undefined)profile[key]=text(data[key],key,2000,false);
      for(const key of ['recruiterVisible','matchingVisible'])if(data[key]!==undefined){assert(typeof data[key]==='boolean','Invalid visibility');profile[key]=data[key];}
      if(data.skills!==undefined){assert(Array.isArray(data.skills)&&data.skills.length<=30,'Invalid skills');profile.skills=data.skills.map(s=>text(s,'skill',60));}
      if(data.cgpa!==undefined){assert(typeof data.cgpa==='number'&&data.cgpa>=0&&data.cgpa<=4,'Invalid CGPA');profile.cgpa=data.cgpa;}
      await database().execute('UPDATE users SET profile=?,first_name=?,last_name=?,updated_at=UTC_TIMESTAMP(3) WHERE id=?',[JSON.stringify(profile),data.firstName===undefined?user.first_name:text(data.firstName,'first name',100),data.lastName===undefined?user.last_name:text(data.lastName,'last name',100),user.id]);
      return send(res,200,{ok:true});
    }
    if(path==='/api/users'&&method==='GET') {
      const q='%'+(url.searchParams.get('q')||'').slice(0,100)+'%';
      const [rows]=await database().execute("SELECT id,first_name,last_name,profile FROM users WHERE status='active' AND id<>? AND (first_name LIKE ? OR last_name LIKE ?) LIMIT 100",[user.id,q,q]);
      return send(res,200,{data:rows.map(r=>({id:r.id,name:r.first_name+' '+r.last_name,university:r.profile.university||''}))});
    }
    if(path==='/api/candidates'&&method==='GET') {
      assert(['recruiter','admin'].includes(user.role),'Recruiter access required',403);
      const [rows]=await database().execute("SELECT id,first_name,last_name,profile FROM users WHERE role='student' AND status='active' AND JSON_EXTRACT(profile,'$.recruiterVisible')=true");
      return send(res,200,{data:rows.map(r=>({id:r.id,name:r.first_name+' '+r.last_name,...r.profile}))});
    }
    if(path==='/api/admin/dashboard'&&method==='GET') {
      assert(user.role==='admin','Administrator access required',403);
      const [[counts]]=await database().execute("SELECT COUNT(*) users,COALESCE(SUM(role='student'),0) students,COALESCE(SUM(role='recruiter'),0) recruiters FROM users");
      const [countsByKind]=await database().execute('SELECT kind,COUNT(*) total FROM records GROUP BY kind');
      const map=Object.fromEntries(countsByKind.map(r=>[r.kind,Number(r.total)]));
      const [recent]=await database().execute('SELECT * FROM users ORDER BY created_at DESC LIMIT 6');
      return send(res,200,{data:{...counts,clubs:map.clubs||0,events:map.clubEvents||0,reports:map.reports||0,openReports:map.reports||0,announcements:map.announcements||0,partnerships:map.partnerships||0,recentUsers:recent.map(userView)}});
    }
    if(path==='/api/notifications'&&method==='GET') { const [rows]=await database().execute('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100',[user.id]);return send(res,200,{data:rows}); }
    if(path==='/api/notifications/read'&&method==='POST') {await database().execute('UPDATE notifications SET read_at=UTC_TIMESTAMP(3) WHERE user_id=? AND read_at IS NULL',[user.id]);return send(res,200,{ok:true});}
    if(path==='/api/conversations'&&method==='GET') {
      const [rows]=await database().execute("SELECT r.* FROM records r JOIN conversation_members m ON m.conversation_id=r.id WHERE m.user_id=? AND r.kind='conversations' ORDER BY r.updated_at DESC",[user.id]);
      const data=[];for(const r of rows){const [members]=await database().execute('SELECT u.id,u.first_name,u.last_name FROM conversation_members m JOIN users u ON u.id=m.user_id WHERE m.conversation_id=?',[r.id]);data.push({...recordView(r),members:members.map(u=>({id:u.id,name:u.first_name+' '+u.last_name}))});}return send(res,200,{data});
    }
    if(path==='/api/conversations'&&method==='POST') {
      const data=await input(req), recipient=uuid(data.recipientId);assert(recipient!==user.id,'Choose another user');
      const id=await transaction(async c=>{
        const [target]=await c.execute("SELECT id FROM users WHERE id=? AND status='active'",[recipient]);assert(target.length,'Recipient not found',404);
        const id=randomUUID();await c.execute("INSERT INTO records(id,kind,owner_id,data) VALUES(?,'conversations',?,'{}')",[id,user.id]);
        await c.execute('INSERT INTO conversation_members(conversation_id,user_id) VALUES(?,?),(?,?)',[id,user.id,id,recipient]);return id;
      });return send(res,201,{data:{id}});
    }
    if(path==='/api/messages'&&['GET','POST'].includes(method)) {
      const data=method==='POST'?await input(req):{};const conversationId=uuid(data.conversationId||url.searchParams.get('conversationId'));
      const [members]=await database().execute('SELECT user_id FROM conversation_members WHERE conversation_id=?',[conversationId]);assert(members.some(m=>m.user_id===user.id),'Conversation not found',404);
      if(method==='GET'){const [rows]=await database().execute("SELECT * FROM records WHERE kind='messages' AND parent_id=? ORDER BY created_at,id LIMIT 1000",[conversationId]);return send(res,200,{data:rows.map(recordView)});}
      const message=text(data.text,'message',2000), id=randomUUID();
      await transaction(async c=>{await c.execute("INSERT INTO records(id,kind,owner_id,parent_id,data) VALUES(?,'messages',?,?,?)",[id,user.id,conversationId,JSON.stringify({text:message})]);await c.execute('UPDATE records SET updated_at=UTC_TIMESTAMP(3) WHERE id=?',[conversationId]);for(const m of members)if(m.user_id!==user.id)await notify(c,m.user_id,'New message');});
      return send(res,201,{data:{id,text:message,ownerId:user.id,createdAt:new Date().toISOString()}});
    }
    if(path==='/api/bids'&&method==='POST') {
      const data=await input(req), auctionId=uuid(data.auctionId), amount=data.amount;
      assert(Number.isFinite(amount)&&amount>0&&amount<=100000000,'Invalid amount');
      const bid=await transaction(async c=>{
        const [rows]=await c.execute("SELECT * FROM records WHERE id=? AND kind='auctions' FOR UPDATE",[auctionId]);const auction=rows[0];assert(auction,'Auction not found',404);
        assert(auction.owner_id!==user.id,'Cannot bid on your own auction',403);assert(Date.parse(auction.data.ends)>Date.now(),'Auction closed',409);
        const [[highest]]=await c.execute('SELECT MAX(amount) amount FROM bids WHERE auction_id=?',[auctionId]);
        const minimum=highest.amount===null?Number(auction.data.minimum):Number(highest.amount)+Number(auction.data.increment);
        assert(amount>=minimum,`Minimum bid is ${minimum}`,409);
        const id=randomUUID();await c.execute('INSERT INTO bids(id,auction_id,user_id,amount) VALUES(?,?,?,?)',[id,auctionId,user.id,amount]);await notify(c,auction.owner_id,'New bid',String(amount));return {id,auctionId,amount};
      });return send(res,201,{data:bid});
    }
    if(path==='/api/bids'&&method==='GET') {
      const auctionId=uuid(url.searchParams.get('auctionId'));
      const [rows]=await database().execute('SELECT b.id,b.auction_id,b.user_id,b.amount,b.created_at,u.first_name,u.last_name FROM bids b JOIN users u ON u.id=b.user_id WHERE b.auction_id=? ORDER BY b.amount DESC',[auctionId]);return send(res,200,{data:rows});
    }
    if(path==='/api/applications'&&method==='POST') {
      assert(user.role==='student','Student account required',403);const data=await input(req),jobId=uuid(data.jobId),letter=text(data.coverLetter||'','cover letter',5000,false);
      const result=await transaction(async c=>{const [rows]=await c.execute("SELECT * FROM records WHERE kind='jobs' AND id=? FOR UPDATE",[jobId]);assert(rows.length,'Job not found',404);assert(rows[0].data.status!=='closed','Job closed',409);const id=randomUUID();await c.execute('INSERT INTO applications(id,job_id,user_id,cover_letter) VALUES(?,?,?,?)',[id,jobId,user.id,letter]);await notify(c,rows[0].owner_id,'New application');return {id,jobId,status:'submitted'};});return send(res,201,{data:result});
    }
    if(path==='/api/applications'&&method==='GET') {const [rows]=await database().execute("SELECT a.* FROM applications a JOIN records j ON j.id=a.job_id WHERE a.user_id=? OR j.owner_id=? OR ?='admin'",[user.id,user.id,user.role]);return send(res,200,{data:rows});}
    if(path.startsWith('/api/bids/')||path.startsWith('/api/applications/'))throw Object.assign(new Error('This operation is not supported'),{status:405});
    const [, ,kind,id]=path.split('/'), rule=rules[kind];assert(rule,'API endpoint not found',404);
    if(id)uuid(id);
    if(method==='GET') {
      const params=[kind];let where='kind=?';
      if(!rule.public && user.role!=='admin'){where+=' AND owner_id=?';params.push(user.id);}
      if(id){where+=' AND id=?';params.push(id);}
      const [rows]=await database().execute(`SELECT * FROM records WHERE ${where} ORDER BY created_at DESC LIMIT 500`,params);
      if(id)assert(rows.length,'Not found',404);
      return send(res,200,{data:id?recordView(rows[0]):rows.map(recordView),count:rows.length});
    }
    assert(['POST','PATCH','DELETE'].includes(method),'Method not allowed',405);
    assert(!rule.roles||rule.roles.includes(user.role),'Role not permitted',403);
    const data=method==='DELETE'?{}:await input(req);
    const result=await transaction(async c=>{
      let existing;
      if(id){const [rows]=await c.execute('SELECT * FROM records WHERE kind=? AND id=? FOR UPDATE',[kind,id]);existing=rows[0];assert(existing,'Not found',404);assert(existing.owner_id===user.id||user.role==='admin','Not permitted',403);}
      else assert(method==='POST','Record ID required',400);
      const parentId=existing?.parent_id||data.clubId||null;
      if(rule.club)await clubPermission(c,parentId,user);
      if(method==='DELETE'){await c.execute('DELETE FROM records WHERE id=?',[id]);return {ok:true};}
      const values={...existing?.data};
      for(const field of rule.fields)if(data[field]!==undefined){assert(['string','number'].includes(typeof data[field]),`Invalid ${field}`);values[field]=typeof data[field]==='string'?text(data[field],field,5000,false):data[field];}
      for(const field of rule.required)assert(values[field]!==undefined&&values[field]!=='',`${field} is required`);
      if(kind==='clubTransactions')assert(Number.isFinite(values.amount)&&values.amount!==0,'Invalid amount');
      if(kind==='clubEvents')assert(Number.isInteger(values.capacity)&&values.capacity>0,'Capacity must be a positive integer');
      if(kind==='auctions'){assert(Number.isFinite(Date.parse(values.ends)),'Invalid closing date');assert(Number.isFinite(values.minimum)&&values.minimum>=0&&Number.isFinite(values.increment)&&values.increment>0,'Invalid bid limits');}
      if(kind==='partnerRequests'||kind==='savedCandidates'){const recipient=uuid(values.toUserId||values.userId);const [found]=await c.execute('SELECT id FROM users WHERE id=?',[recipient]);assert(found.length,'User not found',404);}
      const recordId=id||randomUUID();
      if(existing)await c.execute('UPDATE records SET data=?,updated_at=UTC_TIMESTAMP(3) WHERE id=?',[JSON.stringify(values),id]);
      else await c.execute('INSERT INTO records(id,kind,owner_id,parent_id,data) VALUES(?,?,?,?,?)',[recordId,kind,user.id,parentId,JSON.stringify(values)]);
      if(kind==='partnerRequests'&&!existing)await notify(c,values.toUserId,'New study partner request');
      return {data:{...values,id:recordId,ownerId:user.id,parentId}};
    });return send(res,method==='POST'?201:200,result);
  } catch(error) { const status=error.code==='ER_DUP_ENTRY'?409:error.status||500; if(status===500)console.error('API failure:',error.code||error.name);return send(res,status,{error:{message:status===500?'Server error':status===409?'Record already exists':error.message}}); }
}
