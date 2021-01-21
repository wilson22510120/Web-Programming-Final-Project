import './App.css'
import React, { useEffect, useRef, useState } from 'react'
//import useChat from './useChat'
import { Button, Input, message, Tag ,Select } from 'antd'
import {
  CheckCircleOutlined,
  SyncOutlined,
  UserAddOutlined,
  UserDeleteOutlined
  // CloseCircleOutlined,
  // ExclamationCircleOutlined,
  // ClockCircleOutlined,
  // MinusCircleOutlined,
} from '@ant-design/icons';
import cards from "./images";
let HOST =  window.location.origin.replace(/^http/, 'ws')
const client = new WebSocket(HOST)
const { Option } = Select;
function App() {
  const [score, setScore] = useState([0,0,0,0])
  const [board, setBoard] = useState([[],[],[],[]])
  const [invisible, setInvisible] = useState([])
  const [alive, setAlive] = useState([])             //array, true if that player is alive
  const [guessNum,setGuessNum] = useState('')        //string, the number guessed when you played 1
  const [guess,setGuess] = useState(false)           //bool, true if need something to type guessNum
  const [choose,setChoose] = useState('')            //string, the player's number you want to cast card
  const [extraInput,setExtraInput] = useState(false) //bool, true if need something to type choose
  const [status, setStatus] = useState({})           //JSON{type, msg}, msg you want to present above the page
  const [state, setState] = useState('lobby')        //string, the state of you right now
  const [playerNames, setPlayerNames] = useState([]) //array, the name of all players on this table
  const [hand, setHand] = useState([])               //array, the card you have
  const [username, setUsername] = useState('')       //string, your name
  const [body, setBody] = useState('')               
  const [seatNo, setseatNo] = useState(-1)
  const [turn, setTurn] = useState(-1)
  const [deckNum, setDeckNum] = useState(16)
  const bodyRef = useRef(null)
  const [start, setStart] = useState(false)
  const [lastPlay, setLastPlay] = useState(-1)
  // useEffect(()=>{
    
  // })
  window.onunload = ()=>{
    sendData(['bye', seatNo])
    return "bye"
  }
  
  const sendData = (data) => {
    client.send(JSON.stringify(data))
  }
  const reset = ()=>{
    restart()
    setState("lobby")
    setPlayerNames([])
    setBody('')
    setUsername('')
    setScore([0,0,0,0])
  }
  const restart = ()=>{
    setBoard([[],[],[],[]])
    setInvisible([false, false, false, false])
    setAlive(playerNames.map((v) =>{return (v === 0)?false:true}))            //array, true if that player is alive
    setHand([])               //array, the card you have
    setBody('')
    setDeckNum(-1)
    setDeckNum(16)
    setStart(false)
    setLastPlay(-1)
  }
  const sit = ()=>{
    if(username === ''){
      displayStatus({type: 'error', msg: 'Username can\'t be empty'})
    }
    else{
      for(let i = 0;i<playerNames.length;i++){
        if(playerNames[i] === 0){
          sendData(['sitDown', [i, username]])
          break
        }
      }
    }
  }
  const leave = ()=>{
    if(seatNo === -1){
      return
      
    }
    sendData(['leave', seatNo])
    setPlayerNames((prev)=>
      prev.map((name, i)=>{
        if(i === seatNo) return 0
        else return name
      })
    )
    setseatNo(-1)
    setState("lobby")
  }
  const play = ()=>{
    if(body !== 1 && body !== 0)
      displayStatus({type: 'error', msg: 'please choose a card to play'})

    else if(!isNaN(Number(body)) && turn === seatNo)
      playcard(Number(body))

  }
  const canChoose = (n)=>{
    console.log(invisible, 'aaa')
    if(n === '') {
      console.log("n is null")
      return false
    }
    n = Number(n)
    if(n > 4 || n < 0){
      console.log("out of range")
      return false
    }
    if(!Number.isInteger(n)){
      console.log("n is not a interger")
      return false
    }
    if(!alive[n] || n === seatNo){
      console.log("yourself or dead player")
      return false
    } 
    if(invisible[n]){
      let i = (n + 1)%4
      while(i !== n){
        if(alive[i] && i !== seatNo && !invisible[i]){
          return false
        }
        i = (i+1)%4
      }
    }
    return true
  }
  
  const playcard = (i)=>{

    if(i === 0 || i === 1){
      if(hand[i] === 1){
        if(!canChoose(choose)){
          displayStatus({type: 'error', msg: 'Can\'t choose that player'})
        }
        else if(!Number.isInteger(Number(guessNum))){
          displayStatus({type: 'error', msg: 'Please input an valid card number'})
        }
        else if(Number(guessNum) > 8 || Number(guessNum) < 1){
          displayStatus({type: 'error', msg: 'Please input an valid card number'})
        }
        else if(Number(guessNum) === 1){
          displayStatus({type: 'error', msg: 'Sorry, you can\'t guess card 1'})
        }
        else{
          sendData(['play', [hand[i], choose, guessNum]])
          setBody('')
          setGuessNum('')
          setHand((prev)=>{
            if(i === 0) return [prev[1]]
            else return [prev[0]]
          })
        }
      }
      else if(hand[i] === 2){
        
        if(!canChoose(choose)){
          displayStatus({type: 'error', msg: 'Can\'t choose that player'})
        }
        else{
          sendData(['play', [hand[i], choose]])
          setBody('')
          setHand((prev)=>{
            if(i === 0) return [prev[1]]
            else return [prev[0]]
          })
          
        }
      }
      else if(hand[i] === 3){
        if(!canChoose(choose)){
          displayStatus({type: 'error', msg: 'Can\'t choose that player'})
        }
        
        else{
          sendData(['play', [hand[i], Number(choose), Number(hand[1-i])]])
          setBody('')
          setHand((prev)=>{
            if(i === 0) return [prev[1]]
            else return [prev[0]]
          })
        }
      }
      else if(hand[i] === 4){
        sendData(['play', [hand[i]]])
        setBody('')
        setHand((prev)=>{
          if(i === 0) return [prev[1]]
          else return [prev[0]]
        })
      }
      else if(hand[i] === 5){
        if(hand[1-i] === 7){
          displayStatus({type: 'error', msg: 'You have to play card 7'})
        
        }
        else if(!canChoose(choose)){
          displayStatus({type: 'error', msg: 'Can\'t choose that player'})
        }
        else{
          sendData(['play', [hand[i], Number(choose)]])
          setBody('')
          setHand((prev)=>{
            if(i === 0) return [prev[1]]
            else return [prev[0]]
          })
        }
      }
      else if(hand[i] === 6){
        if(hand[1-i] === 7){
          displayStatus({type: 'error', msg: 'You have to play card 7'})
        
        }
        else if(!canChoose(choose)){
          displayStatus({type: 'error', msg: 'Can\'t choose that player'})
        }
        else{
          sendData(['play', [hand[i], Number(choose), hand[1-i]]])
          setBody('')
          setHand((prev)=>{
            if(i === 0) return [prev[1]]
            else return [prev[0]]
          })
        }
      }
      else if(hand[i] === 7){
        
        sendData(['play', [hand[i]]])
        setBody('')
        setHand((prev)=>{
          if(i === 0) return [prev[1]]
          else return [prev[0]]
        })
        
      }
      else if(hand[i] === 8){
        setBody('')
        displayStatus({type: 'error', msg: 'AAAAAAAAAA'})
      }
      
    }
    else{
      setStatus({type:'error', msg:'AAAAA'})
    }
  }
  
  
  client.onopen = ()=>{
    sendData(['init'])
  }
  client.onmessage = (message) => {
    const { data } = message
    const [task, payload] = JSON.parse(data)
    console.log(task)
    switch (task) {
      case 'status':{
        setStatus(payload)
        break
      }
      case 'reset':{
        setStatus({type:'error', msg:'Somebody left the game, redirect to lobby now...'})
        reset()
        
      }
      case 'seat':{
        setPlayerNames(payload.map((v) =>{return (v === '')?0:v}))
        setAlive(payload.map((v) =>{return (v === '')?false:true}))
        setInvisible(()=>payload.map(() =>{return false}))
        break
      }
      case 'deckNum':{
        setDeckNum(payload)
        break
      }
      case 'sitSuccess':{
        
        setseatNo(payload)
        setState('waiting for start...')
        break
      }
      case 'turn':{
        console.log(state)
        setStart(true)
        if(payload === seatNo) setState('Your turn!!')
        else if(alive[seatNo]) setState('wait')
        setInvisible((prev)=>
          //console.log(prev,'aaaaaa')
          prev.map((v, i)=>{
          return ((i !== payload) && v)
        }))
        setTurn(payload)
        break
      }
      case 'draw':{
        setHand(() => [...hand, payload])
        break
      }
      case 'win':{
        setScore((prev)=>
          prev.map((v, i)=>{
          return (i === payload)?v+1 : v
        }))
        if(payload === seatNo){
          //console.log('aaaaa')
          setState('Your Win!')
        }
        else{
          setState('Player'+String(payload)+' Won!!')
        }
        restart()
        break
      }
      case 'lose':{
        
        if(payload === seatNo){
          //console.log('aaaaa')
          setState('Your lost!')
        }
        let newArr = [...alive]
        newArr[payload] = false
        setAlive(newArr)
        
        displayStatus({type:"info", msg:"player"+String(payload)+" has been eliminated"})
        
        break
      }
      case 'invisible':{
        setInvisible((prev)=>prev.map((v, i)=>{
          return ((i === payload) || v)
        }))
        break
      }
      case 'discard':{
        setHand(()=>[])
        break
      }
      case 'lastPlay':{
        setLastPlay(payload)
        break
      }
      case 'setHand':{
        setHand(()=>[payload])
        break
      }
      case 'boardUpdate':{
        console.log('in')
        let temp = [...board]
        temp[payload[0]].push(payload[1])
        setBoard(()=>temp)
        break
      }
      case 'error':{
        displayStatus({type:"error", msg:payload})

        break
      }
      default:
        break
    }
  }
  
  const displayStatus = (s) => {
    if (s.msg) {
      const { type, msg } = s
      const content = {
        content: msg,
        duration: 2
      }

      switch (type) {
        case 'success':
          message.success(content)
          break
        case 'info':
          message.info(content)
          break
        case 'danger':
        default:
          message.error(content)
          break
      }
    }
  }

  useEffect(()=>{
    if(turn === seatNo && body!==''&&(Number(body) === 1 ||Number(body) === 0)){
      if(hand[Number(body)]===1||hand[Number(body)]===2||hand[Number(body)]===3||
      hand[Number(body)]===5||hand[Number(body)]===6){
        if(hand[Number(body)]===1){
          setGuess(true)
        }
        else setGuess(false)
        setExtraInput(true)
      }
      else{
        setGuess(false)
        setExtraInput(false)
      }
    }
    else{
      setGuess(false)
      setExtraInput(false)
    }
    //console.log(alive)
    
      
  }, [body,turn,seatNo,hand])
  useEffect(() => {
    displayStatus(status)
  }, [status])

  return (
    <div className="App">
      <div className="App-title">
        <h1>{state}</h1>
      </div>
      <div className="App-main">
        <div className="playertableA" >
          <div className="playertablename" 
          style={{
            "textDecoration": !start || (alive[seatNo])?"":("line-through"),
            "backgroundImage": `url(${cards[9]})`
          }}>
            
            {playerNames[(seatNo+4)%4] !== 0 ? playerNames[(seatNo+4)%4]+"/"+score[seatNo]:(!start ? "(waiting for player...)":"")}
            <SyncOutlined spin style={{display:((start && seatNo === turn)?"":"none")}}/>
            
          </div>
          <div>
            
            <div 
              id="playertableA1" 
              className="playercardA" 
              onClick={turn === seatNo&&start?() =>{setBody(0)}:()=>{}} 
              style={{"backgroundImage" :  !start || !alive[seatNo]?"none":`url(${cards[hand[0]]})`, border: body === 0 ? "3px groove white":"" }}>
            </div>
            
            <div 
              id="playertableA2" 
              className="playercardA" 
              onClick={turn === seatNo&&start?() =>{setBody(1)}:()=>{}} 
              style={{"backgroundImage" : !start || turn !== seatNo ? "none":`url(${cards[hand[1]]})`,  border: body === 1 ? "3px groove white":"" }}>
            </div>
          </div>
        </div>
        <div className="playertableB" >
          <div 
            className="playertablename"  
            style={{
              "textDecoration": !start || (alive[(seatNo+1)%4])?"":"line-through", 
              "backgroundImage": !start || playerNames[(seatNo+1)%4] !== 0 ? `url(${cards[9]})` : ""
            }}>
            {playerNames[(seatNo+1)%4] !== 0 ? playerNames[(seatNo+1)%4]+"/"+score[(seatNo+1)%4] :   (!start) ? "(waiting for player...)":""}
            <SyncOutlined spin style={{display:((start && (seatNo+1)%4 === turn)?"":"none")}}/>
          </div>
          <div>
            
            <div 
              id="playertableB1" 
              className="playercard" 
              style={{"backgroundImage" : !start || !alive[(seatNo+1)%4] ? "none" : `url(${cards[0]})`}}>
            </div>
            <div 
              id="playertableB2" 
              className="playercard" 
              style={{"backgroundImage" :  !start || turn !== (seatNo+1)%4 || !alive[(seatNo+1)%4] ? "none" : `url(${cards[0]})` }}>
            </div>
          </div>
        </div>
        <div className="playertableC" >
          <div 
            className="playertablename"  
            style={{
              "textDecoration": !start || (alive[(seatNo+2)%4])?"":"line-through", 
              "backgroundImage": !start || playerNames[(seatNo+2)%4] !== 0 ? `url(${cards[9]})` : ""
          }}>
            {playerNames[(seatNo+2)%4] !== 0 ? playerNames[(seatNo+2)%4]+"/"+score[(seatNo+2)%4] : (!start ? "(waiting for player...)":"")}
            <SyncOutlined spin style={{display:((start && (seatNo+2)%4 === turn)?"":"none")}}/>
          </div>
          <div>
            
            <div 
              id="playertableC1" 
              className="playercard" 
              style={{"backgroundImage" : !start || !alive[(seatNo+2)%4] ? "none" : `url(${cards[0]})`}}>
            </div>
            <div 
              id="playertableC2" 
              className="playercard" 
              style={{"backgroundImage" :  !start || turn !== (seatNo+2)%4 || !alive[(seatNo+2)%4] ? "none" : `url(${cards[0]})` }}>
            </div>
          </div>
        </div>
        <div className="playertableD" >
          <div 
            className="playertablename"  
            style={{
              "textDecoration": !start || (alive[(seatNo+3)%4])?"":"line-through", 
              "backgroundImage": !start || playerNames[(seatNo+3)%4] !== 0 ? `url(${cards[9]})` : ""
          }}>
            {playerNames[(seatNo+3)%4] !== 0 ? playerNames[(seatNo+3)%4]+"/"+score[(seatNo+2)%4] :  (!start ? "(waiting for player...)" : "")}
            <SyncOutlined spin style={{display:((start && (seatNo+3)%4 === turn)?"":"none")}}/>
          
          </div>
          <div>
            
            <div id="playertableD1" 
              className="playercard" 
              style={{"backgroundImage" : !start || !alive[(seatNo+3)%4] ? "none" : `url(${cards[0]})`}}>
            </div>
            <div id="playertableD2" 
              className="playercard" 
              style={{"backgroundImage" :  !start || turn !== (seatNo+3)%4 || !alive[(seatNo+3)%4] ? "none" : `url(${cards[0]})` }}>
            </div>
          </div>
        </div>
        <div style={{"background-color":"white", "display":((state==="lobby"||state==="waiting for start...")?"":"none")}}>
          <Button id="sitButton" 

            type={seatNo===-1?"":"primary"} 
            shape="circle" 
            icon={seatNo===-1?<UserAddOutlined />:<UserDeleteOutlined />} 
            size={"large"}
            onClick={seatNo===-1?sit:leave}
          />
        </div>
        
        <div className="tablecenter" style={state === "wait" || state === "Your turn!!"?{}:{display:"none"}}>
          <div className="discardpile">
            <div className="lastplayed" >Last played</div>
            <div className="cardlastplayed" style={{"backgroundImage": (lastPlay!==-1?`url(${cards[lastPlay]})`:"none")}}>

            </div>
          </div>
          <div className="deck">
            <div className="cardremaining">{"Deck(x"+String(deckNum)+")"}</div>
            <div className="deckcard">
            </div>
          </div>
        </div>
      </div>
      
      
      <div style={!start ?{}:{display:"none"}}>
        <Input
        className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginBottom: 10}}
          
          disabled={state !== "lobby"}
        ></Input>
        
      </div>
      <div>
        <Select 
          className="select"
          placeholder="Select a player" 
          style={extraInput?{ width: 180 }:{ display:"none" }}
          onChange={(e) => {
            setChoose(playerNames.indexOf(e))
          }}>
          {playerNames.filter((player)=>{return (player !== 0 && player !== username && alive[playerNames.indexOf(player)])}).map((player, i) =>(
            <Option className="option" value={player}>
              {player}
            </Option>
          ))}
        </Select>
        <Select
          className="select"
          placeholder="Select a card number" 
          style={guess?{width: 180}:{display:"none"}}
          onChange={(e) => setGuessNum(e)}  
        >
            <Option className="option" value="2"> 2 </Option>
            <Option className="option" value="3"> 3 </Option>
            <Option className="option" value="4"> 4 </Option>
            <Option className="option" value="5"> 5 </Option>
            <Option className="option" value="6"> 6 </Option>
            <Option className="option" value="7"> 7 </Option>
            <Option className="option" value="8"> 8 </Option>
        </Select>
      </div> 
      <div>
        <button className="button" onClick={()=>console.log(start, alive)}>
          aaa
        </button>
        {!start?
          <Button className="button" type="primary" onClick={() => {setStart(true); sendData(['start'])}} style={!start&&seatNo!==-1?{}:{visibility:"hidden"}}>
            Start
          </Button>:
          <Button className="button" type="primary" danger onClick={play} style={state === "Your turn!!" ?{}:{visibility:"hidden"}}>
            Play
          </Button>
        }
        
        
        
             
      </div>
    </div>
  )
}

export default App
