import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Lightbulb } from 'lucide-react';

interface NewSpendingRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRequest: (request: { description: string; amount: number }) => void;
}

export function NewSpendingRequestDialog({
  open,
  onOpenChange,
  onCreateRequest,
}: NewSpendingRequestDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleCreate = () => {
    if (description && amount) {
      onCreateRequest({
        description,
        amount: parseFloat(amount),
      });
      setDescription('');
      setAmount('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Request Payment</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Get approval from group members for this expense
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold text-gray-900">What's this for?</Label>
            <Textarea
              id="description"
              placeholder="e.g., Hotel booking - Langkawi Beach Resort"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-bold text-gray-900">Amount (RM)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="200.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-xl font-bold h-14"
            />
          </div>
          <div className="rounded-2xl border-2 border-orange-100 p-3.5 bg-orange-50">
            <p className="text-xs text-orange-800 font-medium flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 inline-block flex-shrink-0" style={{ color: '#F59E0B' }} />
              <span><span className="font-bold">Tip:</span> Large expenses (RM 500+) require majority approval</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 h-12 font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 h-12 font-bold shadow-lg"
            disabled={!description || !amount}
          >
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
