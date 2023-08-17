import './chat.css'
import Chat, { Bubble, MessageProps, Progress, toast, useMessages } from '@chatui/core'
import '@chatui/core/dist/index.css'
import { useState, useEffect } from 'react'
import clipboardy from 'clipboardy'
import MdEditor from "md-editor-rt"
import "md-editor-rt/lib/style.css"
import sanitizeHtml from 'sanitize-html';
import {completion, getChatRecord, getChatMessages} from '../../services/port'
import { ChatSidebar } from '../../components/ChatSidebar'
import {v4 as uuidv4}  from 'uuid'
import { FloatButton, Layout, message } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Content, Footer } from 'antd/es/layout/layout'

const defaultQuickReplies = [
  {
    name: '清空会话',
    isNew: true,
    isHighlight: true,
  },
  {
    name: '复制会话',
    isNew: false,
    isHighlight: true,
  },
]

const initialMessages = [
  {
    type: 'text',
    content: {
      text: '您好，我是AI助理',
    },
    user: { avatar: '/logo192.png' },
  },
]

let chatContext: { userid: number, chatid: string, subject: string, messages: any[] } = 
  { userid: 1, chatid: uuidv4(), subject: '这是新的会话', messages: [] }

function App() {
  const { messages, appendMsg, setTyping, prependMsgs, resetList } = useMessages(initialMessages)
  const [percentage, setPercentage] = useState(0)
  const [collapsed, setCollapsed] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [chatData, setChatData] = useState<{UserID: string, UserName: string, IsAdmin: boolean, ChatRecord: 
        {ID: number, ChatID: string, Subject: string, CreatedAt: string, UpdatedAt: string}[]}>
        ({UserID: '', UserName: '', IsAdmin: false, ChatRecord:[]})
  const [messageApi, contextHolder] = message.useMessage();      
  
  // 根据角色添加消息
  function appendMessage(role: string, content: string) {
    switch (role) {
      case 'user':
        appendMsg({
          type: 'text',
          content: { text: content },
          position: 'left',
          user: { avatar: '/sscpaul.png' },
        })
        break;
      case 'assistant':
        appendMsg({
          type: 'text',
          content: { text: content },
          position: 'left',
          user: { avatar: '/logo192.png' },
        })
        break;
      case 'system':
        appendMsg({
          type: 'text',
          content: { text: initialMessages[0].content.text },
          position: 'left',
          user: { avatar: '/logo192.png' },
        })
        break;
    }
  }

  const handleFocus = () => {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, 10)
  }

  // clearQuestion 清空文本特殊字符
  function clearQuestion(requestText: string) {
    requestText = requestText.replace(/\s/g, '')
    const punctuation = ',.;!?，。！？、…'
    const runeRequestText = requestText.split('')
    const lastChar = runeRequestText[runeRequestText.length - 1]
    if (punctuation.indexOf(lastChar) < 0) {
      requestText = requestText + '。'
    }
    return requestText
  }

  // clearQuestion 清空文本换行符号
  function clearReply(reply: string) {
    // TODO 清洗回复特殊字符
    return reply
  }

  function handleSend(type: string, val: string) {
    if (percentage > 0) {
      toast.fail('正在等待上一次回复，请稍后')
      return
    }
    if (type === 'text' && val.trim()) {
      appendMsg({
        type: 'text',
        content: { text: val },
        position: 'left',
        user: { avatar: '/sscpaul.png' },
      })

      setTyping(true)
      setPercentage(10)
      onGenCode(val)
    }
  }

  function renderMessageContent(msg: MessageProps) {
    const { type, content } = msg

    switch (type) {
      case 'text':
        let text = content.text
        let isHtml = sanitizeHtml(text) !== text;
        const richTextRegex = /(<[^>]+>)|(```[^`]*```)/gi;
        const isRichText = richTextRegex.test(text);
        if(isHtml || isRichText){
          return (
              <Bubble style={{maxWidth: '100vw'}}><MdEditor
                  style={{float: 'left'}}
                  modelValue = { text } // 要展示的markdown字符串
                  previewOnly = { true } // 只展示预览框部分
              ></MdEditor></Bubble>
          )
        }else{
          return (
              <Bubble style={{maxWidth: '100vw'}}>{text}</Bubble>
          )
        }

      default:
        return null
    }
  }

  async function handleQuickReplyClick(item: { name: string }) {
    if (item.name === '清空会话') {
      // 清空已有消息
      resetList([])
      // 新增初始化消息
      appendMessage('assistant', initialMessages[0].content.text)
      chatContext.messages.splice(0)
    }
    if (item.name === '复制会话') {
      if (messages.length <= 1) {
        return
      }
      const r = messages
        .slice(1)
        .filter((it) => it.type === 'text')
        .map((it) => it.content.text)
        .join('\n')
      console.log('messages', messages, r)
      await clipboardy.write(r)
      toast.success('复制成功', 10_000)
    }
  }

  async function onGenCode(question: string) {
    question = clearQuestion(question)
    chatContext.messages.splice(0)         // 清空聊天记录，只传递最后一条
    chatContext.messages.push({
      role: 'user',
      content: question,
    })

    const res = await completion(chatContext);
    setPercentage(0)
    if (res.data.code === 200) {
      // 检查菜单项目是否包含该主题，不包含则新增
      let chatRecord = chatData.ChatRecord
      if (chatRecord === null || chatRecord.length === 0) {
        handleRefreshMenu(res.data.data.ChatRecord[0].ChatID)
      } else {
        let index = chatRecord.findIndex((item) => item.ChatID === res.data.data.ChatRecord[0].ChatID)
        if (index < 0) {
          handleRefreshMenu(res.data.data.ChatRecord[0].ChatID)
        } else {
          let reply = clearReply(res.data.data.Reply)
          appendMessage('assistant', reply)
        }  
      }
    } else {
      toast.fail('请求出错，' + res.data.errorMsg, 5000)
    }
  }

  function handleMenuItemClick(id: number, chatID: string, subject: string) {
    getChatMessages(chatID).then((res) => {
      if (res.data.code === 200) {
        // 清空已有消息
        resetList([])
        let chatMessages = JSON.parse(res.data.data.messages)
        chatMessages.forEach((item: any) => {
          appendMessage(item.role, item.content)
        })
        chatContext.messages.splice(0)
        chatContext.chatid = chatID
        chatContext.subject = subject
      } else {
        toast.fail('请求出错，' + res.data.errorMsg)
        return toast.show('请求出错，' + res.data.errorMsg, undefined);
      }
    });
  }

  function handleNewChatClick() {
    // 清空已有消息
    resetList([])
    // 新增初始化消息
    appendMessage('assistant', initialMessages[0].content.text)
    chatContext.messages.splice(0)
    chatContext.chatid = uuidv4()
    chatContext.subject = '这是新的会话'
  }

  function handleRefreshMenu(chatID: string) {
    getChatRecord().then((res) => {
      setChatData(res.data.data)
      let chatRecord = res.data.data.ChatRecord
      if (chatRecord === null || chatRecord.length === 0) {
        handleNewChatClick()
        return
      }
      if (chatID === '') {
        handleMenuItemClick(chatRecord[0].ID, chatRecord[0].ChatID, chatRecord[0].Subject)
      } else {
        let index = chatRecord.findIndex((item: { ChatID: string }) => item.ChatID === chatID)
        if (index >= 0) {
          handleMenuItemClick(chatRecord[index].ID, chatRecord[index].ChatID, chatRecord[index].Subject)
        }
      }
    })
 }

  // 初始化
  useEffect(() => {
    handleRefreshMenu('')
  }, [])

  return (
    <div>
      <Layout>
        <ChatSidebar collapsed={collapsed} toggled={toggled} data={JSON.stringify(chatData)}
          onMenuItemClick={handleMenuItemClick} onNewChatClick={handleNewChatClick} 
          refreshMenu={handleRefreshMenu}>
        </ChatSidebar>
        <Content style={{height: '100vh'}}>
          <Layout>
            <Content style={{height: `calc(100vh - 5px)`}}>
              <Chat
                navbar={{
                  leftContent: {
                    icon: 'chevron-left',
                    title: 'Back',
                  },
                  rightContent: [
                    {
                      icon: 'apps',
                      title: 'Applications',
                    },
                    {
                      icon: 'ellipsis-h',
                      title: 'More',
                    },
                  ],
                  title: '基于ChatGPT的AI助手',
                }}
                messages={messages}
                renderMessageContent={renderMessageContent}
                quickReplies={defaultQuickReplies}
                onQuickReplyClick={handleQuickReplyClick}
                onSend={handleSend}
                onInputFocus={handleFocus}
              />
            </Content>
            <Footer style={{height: '5px', padding: 0}}>
              <Progress value={percentage} />
            </Footer>
          </Layout>
        </Content>
      </Layout>
      <FloatButton icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
        type="primary" shape='circle' tooltip={collapsed ? '展开会话记录' : '收起会话记录'}
        onClick={()=> setCollapsed(!collapsed)} style={{ top: 10, left: 10 }} />
      {contextHolder}
    </div>
  )
}

export default App

