import { afterEach, describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { nextTick } from "vue";
import DeleteReviewModal from "~/components/archive/DeleteReviewModal.vue";

describe("DeleteReviewModal", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });

  it("renders a visible dialog when open", async () => {
    await mountSuspended(DeleteReviewModal, {
      props: { open: true, reviewName: "Sprint 42" },
    });

    const dialog = document.body.querySelector(".delete-modal");
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain('Delete "Sprint 42"?');
  });

  it("emits close action", async () => {
    const wrapper = await mountSuspended(DeleteReviewModal, {
      props: { open: true, reviewName: "Sprint 42" },
    });

    const cancel = [...document.body.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Cancel",
    ) as HTMLButtonElement;
    cancel.click();
    await nextTick();

    expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
  });

  it("emits confirm action", async () => {
    const wrapper = await mountSuspended(DeleteReviewModal, {
      props: { open: true, reviewName: "Sprint 42" },
    });

    const confirm = [...document.body.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Delete",
    ) as HTMLButtonElement;
    confirm.click();
    await nextTick();

    expect(wrapper.emitted("confirm")).toBeTruthy();
  });
});
