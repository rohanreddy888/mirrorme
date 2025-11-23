import { use } from "react";
import Chat from "./chat";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Chat mirrorID={id} />;
}