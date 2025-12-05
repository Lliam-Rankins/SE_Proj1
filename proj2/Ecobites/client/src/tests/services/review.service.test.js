import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../../api/axios.config';
import { reviewService } from '../../api/services/review.service';

vi.mock('../../api/axios.config');

describe('reviewService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('create calls POST /reviews', async () => {
    api.post.mockResolvedValue({ data: { ok: true } });

    const res = await reviewService.create({ rating: 5, comment: 'Great!' });

    expect(api.post).toHaveBeenCalledWith('/reviews', { rating: 5, comment: 'Great!' });
    expect(res).toEqual({ ok: true });
  });

  it('getByRestaurant calls GET /reviews/restaurant/:id with params', async () => {
    api.get.mockResolvedValue({ data: [{ id: 'r1' }] });

    const res = await reviewService.getByRestaurant('rest1', { limit: 10 });

    expect(api.get).toHaveBeenCalledWith('/reviews/restaurant/rest1', { params: { limit: 10 } });
    expect(res).toEqual([{ id: 'r1' }]);
  });

  it('getMyReviews calls GET /reviews/my-reviews with params', async () => {
    api.get.mockResolvedValue({ data: [{ id: 'm1' }] });

    const res = await reviewService.getMyReviews({ page: 2 });

    expect(api.get).toHaveBeenCalledWith('/reviews/my-reviews', { params: { page: 2 } });
    expect(res).toEqual([{ id: 'm1' }]);
  });

  it('update calls PUT /reviews/:id', async () => {
    api.put.mockResolvedValue({ data: { id: 'rev1', comment: 'Updated' } });

    const res = await reviewService.update('rev1', { comment: 'Updated' });

    expect(api.put).toHaveBeenCalledWith('/reviews/rev1', { comment: 'Updated' });
    expect(res).toEqual({ id: 'rev1', comment: 'Updated' });
  });

  it('delete calls DELETE /reviews/:id', async () => {
    api.delete.mockResolvedValue({ data: { deleted: true } });

    const res = await reviewService.delete('rev1');

    expect(api.delete).toHaveBeenCalledWith('/reviews/rev1');
    expect(res).toEqual({ deleted: true });
  });

  it('respond calls POST /reviews/:id/response', async () => {
    api.post.mockResolvedValue({ data: { response: 'Thanks!' } });

    const res = await reviewService.respond('rev1', 'Thanks!');

    expect(api.post).toHaveBeenCalledWith('/reviews/rev1/response', { response: 'Thanks!' });
    expect(res).toEqual({ response: 'Thanks!' });
  });

  it('markHelpful calls POST /reviews/:id/helpful', async () => {
    api.post.mockResolvedValue({ data: { helpful: true } });

    const res = await reviewService.markHelpful('rev1');

    expect(api.post).toHaveBeenCalledWith('/reviews/rev1/helpful');
    expect(res).toEqual({ helpful: true });
  });
});
import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../../api/axios.config';
import { reviewService } from '../../api/services/review.service';

vi.mock('../../api/axios.config');

describe('reviewService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('create calls POST /reviews', async () => {
    api.post.mockResolvedValue({ data: { ok: true } });

    const res = await reviewService.create({ rating: 5, comment: 'Great!' });

    expect(api.post).toHaveBeenCalledWith('/reviews', { rating: 5, comment: 'Great!' });
    expect(res).toEqual({ ok: true });
  });

  it('getByRestaurant calls GET /reviews/restaurant/:id with params', async () => {
    api.get.mockResolvedValue({ data: [{ id: 'r1' }] });

    const res = await reviewService.getByRestaurant('rest1', { limit: 10 });

    expect(api.get).toHaveBeenCalledWith('/reviews/restaurant/rest1', { params: { limit: 10 } });
    expect(res).toEqual([{ id: 'r1' }]);
  });

  it('getMyReviews calls GET /reviews/my-reviews with params', async () => {
    api.get.mockResolvedValue({ data: [{ id: 'm1' }] });

    const res = await reviewService.getMyReviews({ page: 2 });

    expect(api.get).toHaveBeenCalledWith('/reviews/my-reviews', { params: { page: 2 } });
    expect(res).toEqual([{ id: 'm1' }]);
  });

  it('update calls PUT /reviews/:id', async () => {
    api.put.mockResolvedValue({ data: { id: 'rev1', comment: 'Updated' } });

    const res = await reviewService.update('rev1', { comment: 'Updated' });

    expect(api.put).toHaveBeenCalledWith('/reviews/rev1', { comment: 'Updated' });
    expect(res).toEqual({ id: 'rev1', comment: 'Updated' });
  });

  it('delete calls DELETE /reviews/:id', async () => {
    api.delete.mockResolvedValue({ data: { deleted: true } });

    const res = await reviewService.delete('rev1');

    expect(api.delete).toHaveBeenCalledWith('/reviews/rev1');
    expect(res).toEqual({ deleted: true });
  });

  it('respond calls POST /reviews/:id/response', async () => {
    api.post.mockResolvedValue({ data: { response: 'Thanks!' } });

    const res = await reviewService.respond('rev1', 'Thanks!');

    expect(api.post).toHaveBeenCalledWith('/reviews/rev1/response', { response: 'Thanks!' });
    expect(res).toEqual({ response: 'Thanks!' });
  });

  it('markHelpful calls POST /reviews/:id/helpful', async () => {
    api.post.mockResolvedValue({ data: { helpful: true } });

    const res = await reviewService.markHelpful('rev1');

    expect(api.post).toHaveBeenCalledWith('/reviews/rev1/helpful');
    expect(res).toEqual({ helpful: true });
  });
});
