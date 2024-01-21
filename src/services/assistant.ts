import openConfig from '@/openai-config';
import { Run } from 'openai/src/resources/beta/threads/index.js';
import { Executor } from './gpt-tools/excecutor';

type WaitForActionOptions = {
  runId: string;
  threadId: string
};

const enum RunStatus {
  queued = 'queued',
  inProgress = 'in_progress',
  requiresAction = 'requires_action',
  cancelling = 'cancelling',
  cancelled = 'cancelled',
  failed = 'failed',
  completed = 'completed',
  expired = 'expired',
}

async function waitForAction({ threadId, runId }:WaitForActionOptions) {
  const doneActions: string[] = [];

  return new Promise<Run>((res, rej) => {
    const openai = openConfig.value;
    if (openai == null) { rej(new Error()); return; }

    const getRetrieve = async () => {
      try {
        const retrieve = await openai.beta.threads.runs.retrieve(
          threadId,
          runId,
        );

        const { status } = retrieve;

        if (
          status === RunStatus.cancelled
          || status === RunStatus.failed
          || status === RunStatus.expired
        ) {
          rej(new Error('Fail'));
        }

        if (status === RunStatus.completed) {
          res(retrieve);
          return;
        }

        if (
          status === RunStatus.requiresAction
        ) {
          // TODO: Revistar si debería mandar los errores o cortar la conversación ahí
          // TODO: Manejar erroes: undefined, o que cambie el tipo de la required_action

          const { tool_calls: toolCalls } = retrieve.required_action!
            .submit_tool_outputs;

          // *Filter already called tools
          const uncalledTools = toolCalls.filter((tool) => !doneActions.includes(tool.id));

          // *Check if there are uncalled functions
          if (uncalledTools.length > 0) {
            const executions = await Executor(
              uncalledTools,
            );

            doneActions.push(...executions.map((ex) => ex.tool_call_id));

            await openai.beta.threads.runs.submitToolOutputs(
              threadId,
              runId,
              {
                tool_outputs: executions,
              },
            );
          }
        }

        // if (status === RunStatus.queued
        //   || status === RunStatus.inProgress
        //   || status === RunStatus.cancelling
        // ) {
        setTimeout(getRetrieve, 1000 / 20);
        // }
      } catch (err) {
        rej(err);
      }
    };
    getRetrieve();
  });
}

export async function startConversation(): Promise<{ threadId: string }> {
  const openai = openConfig.value;
  if (openai == null) throw new Error('NO OpenAi'); // TODO: Cambiar por custm Error

  const thread = await openai.beta.threads.create();

  return {
    threadId: thread.id,
  };
}

type ChatUserMessage = {
  message: string
  threadId: string
};
export async function sendMessage({ message, threadId }: ChatUserMessage) {
  const openai = openConfig.value;
  if (openai == null) throw new Error('NO OpenAi'); // TODO: Cambiar por custm Error

  openai.beta.threads.messages.create(threadId, {
    content: message,
    role: 'user',
  });

  try {
    const run = await openai.beta.threads.runs.create(
      threadId,
      {
        assistant_id: openConfig.assitantId,
      },
    );

    const runRetv = await waitForAction({
      threadId,
      runId: run.id,
    });

    if (runRetv.status === RunStatus.completed) {
      const { data: messages } = await openai.beta.threads.messages.list(threadId, {
        limit: 1,
      });
      const response = messages[0].content[0];

      if (response.type === 'text') {
        return response.text.value;
      }
    }
    throw new Error(`Error checking for Run, Status: ${runRetv.status}`);
  } catch (err) {
    console.error(err);
    return `${err}`;
  }
}

export async function deleteConversation(threadId: string) {
  const openai = openConfig.value;
  if (openai == null) throw new Error('NO OpenAi'); // TODO: Cambiar por custm Error

  const deleted = await openai.beta.threads.del(threadId);
  return {
    deleted: deleted.deleted,
    id: deleted.id,
  };
}
