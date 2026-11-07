import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCancelDeployment } from "@/features/deployments/mutations";
import { shortId } from "@/lib/format";

function CancelDeploymentDialog({
  projectId,
  deploymentId,
  onOpenChange,
}: {
  projectId: string;
  deploymentId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const cancel = useCancelDeployment(projectId);

  return (
    <AlertDialog open={deploymentId !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel deployment?</AlertDialogTitle>
          <AlertDialogDescription>
            Deployment{" "}
            <span className="font-mono text-foreground">
              {deploymentId ? shortId(deploymentId) : ""}
            </span>{" "}
            stops building and won't be promoted to production. This can't be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep building</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={cancel.isPending || !deploymentId}
            onClick={() => {
              if (!deploymentId) {
                return;
              }

              cancel.mutate(deploymentId, {
                onSettled: () => onOpenChange(false),
              });
            }}
          >
            {cancel.isPending ? <Spinner data-icon="inline-start" /> : null}
            Cancel deployment
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { CancelDeploymentDialog };
