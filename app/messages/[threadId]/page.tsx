import { ChatScreen } from "@/components/screens/ChatScreen";

export default async function ChatPage({
  params
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <ChatScreen threadId={threadId} />;
}
