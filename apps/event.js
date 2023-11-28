import plugin from '../../../lib/plugins/plugin.js'
import {createClient, createClientByCache, Qrcode} from "pu-client";
import log4js from "log4js";
import {users, clients, isActive} from "../common/common.js"
const logger=log4js.getLogger("pu-plugin");


export class PuEvent extends plugin {
  constructor () {
    super({
      name: 'Pu活动',
      dsc: '与pu活动相关',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#添加活动(.*)$',
        },
        {
          reg: '^#删除活动(.*)$',
        },
        {
          reg: '^#活动详情(.*)$',
        }

      ]
    })
  }
  async accept () {
    if(this.e.raw_message.includes('json消息')){
      if (isActive(this.e.user_id)){
        const data=JSON.parse(this.e.parsed.content)
        const match =  data.meta.news.jumpUrl.match(/(?:\?|&)desc=(\d+)/);
        if (match) {
          const descValue = match[1];

          const client=clients.get(this.e.user_id);
          client.EventInfo(descValue).then((v)=>{

            this.reply(v)
          })
        } else {
          console.log('未找到匹配');
        }
      }else {
        this.reply("请先登录pu")
      }
    }
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
      this.reply(`登录成功 学号: ${client.userinfo.uid}`)
      clients.set(this.e.user_id,client);
      if(!cache[this.e.user_id]){

        cache[this.e.user_id]=[]
      }

      users[this.e.user_id]={ school: client.userinfo.sid, student: client.userinfo.sno };




    }else {
      if(type==="qrcode"){
        this.reply("登录超时")
      }else {
        this.reply("登录失败: 请检查学号密码是否正确")}
    }

  }
  clientCheck(){
    checkLocalUserClient();
  }
  checkLocalUserClient(){
    for (const key in users) {
      const value = users[key];
      if(value!=={}){
        createClientByCache(value.student,value.school).catch((res)=>{
          users[key]={}
          Bot.sendPrivateMsg(key,value.student+"Pu Token已失效请重新登录")
        })

      }     }
  }

}
