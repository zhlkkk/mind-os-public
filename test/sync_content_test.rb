require "fileutils"
require "tmpdir"
require "minitest/autorun"

require_relative "../scripts/sync_content"

class SyncContentTest < Minitest::Test
  def setup
    @tmpdir = Dir.mktmpdir
    @source_root = File.join(@tmpdir, "private", "raw", "publish")
    @dest_root = File.join(@tmpdir, "public", "content", "articles")
    FileUtils.mkdir_p(@source_root)
  end

  def teardown
    FileUtils.remove_entry(@tmpdir)
  end

  def test_syncs_single_source_file_to_public_article_contract
    source_path = File.join(@source_root, "2026-05-19-example-note.md")
    File.write(source_path, <<~MARKDOWN)
      ---
      title: 示例文章
      date: 2026-05-19
      author: private-author
      status: draft
      tags: [mind-os, obsidian]
      source: docs/private-plan.md
      ---

      # 示例文章

      这是一段用于生成摘要的公开正文，应该被保留。

      参考 [[rag-vs-llm-wiki]] 和 [[distill-desktop|Distill]]。

      ![[private-image.png]]
    MARKDOWN

    result = ContentSync.sync_file(source_path, @dest_root)

    output = File.read(result.output_path)
    assert_includes output, "slug: example-note"
    assert_includes output, "status: ready"
    assert_includes output, "summary: 这是一段用于生成摘要的公开正文，应该被保留。"
    assert_includes output, "origin:"
    assert_includes output, "  private_path: raw/publish/2026-05-19-example-note.md"
    assert_includes output, "formats:"
    assert_includes output, "  html: /articles/example-note"
    assert_includes output, "参考 rag-vs-llm-wiki 和 Distill。"
    refute_includes output, "author:"
    refute_includes output, "source:"
    refute_includes output, "[["
    refute_includes output, "![["
    assert_equal File.join(@dest_root, "2026-05-19-example-note.md"), result.output_path
  end

  def test_directory_sync_skips_drafts_by_default
    ready_path = File.join(@source_root, "2026-05-19-ready-note.md")
    draft_path = File.join(@source_root, "2026-05-20-draft-note.md")
    archived_path = File.join(@source_root, "2026-05-21-archived-note.md")

    File.write(ready_path, <<~MARKDOWN)
      ---
      title: Ready Note
      date: 2026-05-19
      status: ready
      tags: [mind-os]
      ---

      # Ready Note

      Ready body.
    MARKDOWN

    File.write(draft_path, <<~MARKDOWN)
      ---
      title: Draft Note
      date: 2026-05-20
      status: draft
      tags: [mind-os]
      ---

      # Draft Note

      Draft body.
    MARKDOWN

    File.write(archived_path, <<~MARKDOWN)
      ---
      title: Archived Note
      date: 2026-05-21
      status: archived
      tags: [mind-os]
      ---

      # Archived Note

      Archived body.
    MARKDOWN

    results = ContentSync.sync_directory(@source_root, @dest_root)

    assert_equal ["2026-05-19-ready-note.md"], results.map { |result| File.basename(result.output_path) }
    assert File.exist?(File.join(@dest_root, "2026-05-19-ready-note.md"))
    refute File.exist?(File.join(@dest_root, "2026-05-20-draft-note.md"))
    refute File.exist?(File.join(@dest_root, "2026-05-21-archived-note.md"))
  end
end
