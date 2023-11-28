import plugin from '../../../lib/plugins/plugin.js'
import {createClient, createClientByCache, Qrcode} from "pu-client";
import log4js from "log4js";
import {users, clients, isActive, saveUserData, loadUserData, loadClients} from "../common/common.js"
const logger=log4js.getLogger("pu-plugin");

export class PuAccount extends plugin {
  constructor () {
    super({
      name: '登录pu',
      dsc: '登录pu口袋校园',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#pu登录(.*)$',
          fnc: 'login'
        },
        {
          reg: '^#pu删除账户(.*)$',
          fnc: 'delete'
        },
        {
          reg: '^#pu我的账户(.*)$',
        }

      ]
    })
    this.task = [
      {
        name: '检查用户token是否可用',
        fnc: this.checkClients,
        cron: '0/1 * * * * *'
      }
    ]
    loadUserData();
    loadClients();
  }

  async login () {
    if(clients.has(this.e.user_id)){
      this.reply("你已经登录了")
      return
    }
    const info=  this.e.raw_message.split(" ");
    let type="none"
    if(info.length===1){
      type="qrcode"
    }
    if(info.length===2){
      if(info[1]==="二维码"){
        type="qrcode"}
    }
    if(info.length===4){
      type="password"
    }
    let client;
    switch (type){
      case "qrcode":
        const qr= await Qrcode().then((v)=>{return v})
        await this.reply( [segment.image("base64://"+qr.base64.substring(22)),"请在30秒内扫描二维码登录pu口袋校园"], false, { at: true,recallMsg: 30})
        client= await createClient(qr.token);
        break;
      case "password":
        client= await createClient(info[0],info[1],info[2]);
        break;
      default:
        this.reply("参数错误 #pu登录 [学号] [密码] [学校id] 或者 #pu登录 二维码 无参数默认二维码登录")
    }
    if(client){

      logger.info("登录成功"+client.userinfo)
      this.reply(`登录成功 学号: ${client.userinfo.sno}`)
      clients.set(this.e.user_id,client);
      if(!users[this.e.user_id]){
        users[this.e.user_id]=[]
      }

      users[this.e.user_id]={ school: client.userinfo.sid, student: client.userinfo.sno };
      loadUserData();
      saveUserData();
    }else {
      if(type==="qrcode"){
        this.reply("登录超时")
      }else {
        this.reply("登录失败: 请检查学号密码是否正确")}
    }

  }
  async delete(){
    if(!isActive(this.e.user_id)){
      this.reply("你还没有登录")
      return
    }
    clients.delete(this.e.user_id)
    delete users[this.e.user_id]
    saveUserData();
    this.reply("删除成功")
  }
  async checkClients(){
    let flag=false;
    for (const key in clients) {
      const client = clients[key];

      await client.test().catch((res)=>{
        delete clients[key]
        delete users[key]
        flag=true;
      })

    }
    if(flag){
      saveUserData();
    }
  }

}
