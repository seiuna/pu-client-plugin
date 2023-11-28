import Fs from "fs";
import {createClientByCache} from 'pu-client'

export const clients=new Map();

export let users= { }
export const baseDir= process.cwd()+"\\pu-client\\plugin-data"

export const userdata= baseDir+"\\userinfo.json"
export function saveUserData(){
    Fs.mkdirSync(baseDir,{recursive:true})


        Fs.writeFileSync(userdata,JSON.stringify(users))

}

export function loadUserData(){
    if(Fs.existsSync(userdata)){
        users=JSON.parse(Fs.readFileSync(userdata).toString())
    }
}
export function isActive(userid){

    return clients.has(userid+'')

}

export function loadClients(){
  for (const key in users) {
    const value = users[key];
    if(!clients.has(key)){
        createClientByCache(value.student,value.school).then((res)=>{
        clients.set(key,res)
      }).catch((res)=>{

      })
    }
  }
}
