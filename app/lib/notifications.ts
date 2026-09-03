import crypto from "node:crypto";

export type NotificationType =
  | "balance"
  | "guarantee"
  | "profit"
  | "order"
  | "package"
  | "kyc"
  | "withdrawal"
  | "system";

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
};

export function addNotification(
  db: any,
  userId: string,
  data: {
    title: string;
    message: string;
    type?: NotificationType;
    metadata?: Record<string, any>;
  }
) {
  if (!db.notifications) db.notifications = [];
  const notif: Notification = {
    id: crypto.randomUUID(),
    userId: String(userId),
    title: data.title,
    message: data.message,
    type: data.type || "system",
    read: false,
    createdAt: new Date().toISOString(),
    metadata: data.metadata || {}
  };
  db.notifications.unshift(notif);
  if (db.notifications.length > 500) {
    db.notifications = db.notifications.slice(0, 500);
  }
  return notif;
}

export function addSystemMessage(db:any, customerId:string, text:string){
  let conversation=db.conversations.find((c:any)=>c.customerId===customerId);
  if(!conversation){
    conversation={id:crypto.randomUUID(),customerId,status:"open",updatedAt:new Date().toISOString()};
    db.conversations.push(conversation);
  }
  const message={id:crypto.randomUUID(),conversationId:conversation.id,senderId:"system",text,createdAt:new Date().toISOString(),readBy:[]};
  db.messages.push(message);
  conversation.updatedAt=message.createdAt;
  conversation.status="open";
  return message;
}
